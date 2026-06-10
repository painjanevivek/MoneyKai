package com.moneykai.nativecapture

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object MoneyKaiSmsFilters {
  private const val MAX_SMS_FIELD_LENGTH = 500
  private val amountPattern = Regex("""(?:rs\.?|inr|\u20B9)\s*\d""")
  private val bareActionAmountPattern = Regex("""\b(?:debited|credited|spent|paid|received|sent|withdrawn|transferred|deposited)\s+(?:by|of)?\s*\d""", RegexOption.IGNORE_CASE)
  private val officialSenderPattern = Regex("""^[A-Z]{2}-[A-Z0-9]{3,12}$""")
  private val compactOfficialSenderPattern = Regex("""^[A-Z0-9]{4,12}$""")
  private val numericSenderPattern = Regex("""^\+?\d{8,}$""")
  private val senderTerms = listOf(
    "bank",
    "hdfc",
    "icici",
    "axis",
    "sbi",
    "kotak",
    "yesbnk",
    "idfc",
    "indus",
    "federal",
    "paytm",
    "phonepe",
    "gpay",
    "amazonpay",
    "upi",
    "imps",
    "neft",
    "rtgs"
  )
  private val moneyTerms = listOf("rs", "inr", "\u20B9", "upi", "card", "account", "a/c", "wallet", "bank")
  private val transactionTerms = listOf(
    "debited",
    "credited",
    "spent",
    "paid",
    "received",
    "transaction",
    "purchase",
    "withdrawn",
    "withdrawal",
    "transferred",
    "deposited",
    "deposit by transfer",
    "refund",
    "cashback"
  )
  private val noiseTerms = listOf(
    "otp",
    "one-time password",
    "verification code",
    "offer",
    "coupon",
    "failed",
    "declined",
    "unsuccessful",
    "low balance",
    "statement",
    "mandate",
    "autopay",
    "will be debited",
    "scheduled",
    "password",
    "share your experience",
    "feedback",
    "thank you for the transaction done today",
    "tdr/stdr",
    "cheque",
    "chq",
    "gst",
    "gstin",
    "cgst",
    "sgst",
    "igst",
    "tax invoice"
  )

  fun shouldImportSms(sender: String, body: String): Boolean =
    looksLikeOfficialTransactionSender(sender) && looksLikeFinancialSms(body)

  fun looksLikeFinancialSms(value: String): Boolean {
    val text = value.lowercase(Locale.US)
    val hasMoneySignal = moneyTerms.any { text.contains(it) } ||
      amountPattern.containsMatchIn(text) ||
      bareActionAmountPattern.containsMatchIn(text)
    val hasTransactionSignal = transactionTerms.any { text.contains(it) }
    val hasNoiseSignal = noiseTerms.any { text.contains(it) }
    return hasMoneySignal && hasTransactionSignal && !hasNoiseSignal
  }

  fun looksLikeOfficialTransactionSender(sender: String): Boolean {
    val trimmed = sender.trim()
    if (trimmed.isBlank() || numericSenderPattern.matches(trimmed)) {
      return false
    }

    val uppercaseSender = trimmed.uppercase(Locale.US)
    val lowercaseSender = trimmed.lowercase(Locale.US)
    return officialSenderPattern.matches(uppercaseSender) ||
      (compactOfficialSenderPattern.matches(uppercaseSender) && senderTerms.any { lowercaseSender.contains(it) }) ||
      senderTerms.any { lowercaseSender.contains(it) }
  }

  fun sanitizeSmsText(value: String): String =
    value
      .replace(Regex("""\b\d{6}\b"""), "[code]")
      .replace(Regex("""\b(?:xx|x{2,})\d+\b""", RegexOption.IGNORE_CASE), "[masked]")
      .replace(Regex("""[a-z0-9._%+-]+@[a-z0-9.-]+\b""", RegexOption.IGNORE_CASE), "[vpa]")
      .replace(
        Regex("""\b((?:upi\s*)?(?:ref(?:erence)?|rrn|utr|transaction id|txn id|order id|imps)\s*(?:no\.?|number|id)?\s*[:#-]?)\s*[a-z0-9/-]{6,}""", RegexOption.IGNORE_CASE),
        "$1 [ref]"
      )
      .replace(Regex("""\b\d{8,}\b"""), "[number]")
      .take(MAX_SMS_FIELD_LENGTH)

  fun extractAccountHint(value: String): String? {
    val accountPattern = Regex("""\b(?:a/c|account|acct)\s*(?:no\.?|number)?\s*(?:ending\s*)?(?:x{1,}|xx)?\s*(\d{3,6})\b""", RegexOption.IGNORE_CASE)
    val compactPattern = Regex("""\b(?:x{1,}|xx)(\d{3,6})\b""", RegexOption.IGNORE_CASE)
    val accountDigits = accountPattern.find(value)?.groupValues?.getOrNull(1)
      ?: compactPattern.find(value)?.groupValues?.getOrNull(1)
      ?: return null

    return "ending ${accountDigits.takeLast(4)}"
  }

  fun buildAccountId(sender: String, body: String): String? {
    val bankKey = deriveBankKey(sender)
    if (bankKey.isBlank()) return null

    val accountKeyPart = extractAccountHint(body)
      ?.replace(Regex("""[^a-z0-9]+""", RegexOption.IGNORE_CASE), "")
      ?.lowercase(Locale.US)
      ?: "sender"

    return "sms:$bankKey:$accountKeyPart"
  }

  private fun deriveBankKey(sender: String): String {
    val normalized = sender.trim().uppercase(Locale.US)
    if (normalized.isBlank()) return ""

    val senderCore = Regex("""^[A-Z]{2}-([A-Z0-9]{3,12})(?:-[A-Z])?$""")
      .find(normalized)
      ?.groupValues
      ?.getOrNull(1)
      ?: normalized

    return senderCore.replace(Regex("""[^A-Z0-9]"""), "").lowercase(Locale.US)
  }

  fun toIsoUtc(timestamp: Long): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("UTC")
    return formatter.format(Date(timestamp))
  }
}
