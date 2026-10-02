package com.moneykai.nativecapture

import java.security.MessageDigest
import java.util.Locale

/** Validation only, not a ledger writer. Existing 500-character retention limit is unchanged.
 * User-requested auto-add is separately opt-in and OFF by default in the JS store.
 * Original SMS is examined in memory before existing redaction; it is never retained here.
 */
object MoneyKaiSmsAutoRecord {
  private val reference = Regex("""\b(?:upi\s*)?(?:ref(?:erence)?|refno|rrn|utr|transaction id|txn id)\s*(?:no\.?|number|id)?\s*[:#-]?\s*([a-z0-9/-]{6,})\b""", RegexOption.IGNORE_CASE)
  private val slashReference = Regex("""\bupi/p2[amp]/([a-z0-9-]{6,})/""", RegexOption.IGNORE_CASE)
  fun referenceHash(body: String): String? {
    val value = (reference.find(body) ?: slashReference.find(body))?.groupValues?.get(1)?.lowercase(Locale.US) ?: return null
    if (!value.any { it.isDigit() }) return null // "reference unavailable" is not a payment reference.
    return MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }
  }
  fun safe(body: String): Boolean {
    if (body.length > 500 || referenceHash(body) == null || !MoneyKaiSmsFilters.looksLikeFinancialSms(body)) return false
    if (Regex("""\b(?:aed|usd|eur|gbp|sar|qar|omr|bhd|kwd|pending|initiated|scheduled|reversed|reversal|refund|cashback|dispute|suspicious|fraud|unauthorized|unknown|not completed|will be|once processed)\b|https?:|www\.|[$€£]""", RegexOption.IGNORE_CASE).containsMatchIn(body)) return false
    val debit = Regex("""\b(?:debited|spent|paid|sent|withdrawn|transferred)\b""", RegexOption.IGNORE_CASE).containsMatchIn(body)
    val credit = Regex("""\b(?:credited|received|deposited)\b""", RegexOption.IGNORE_CASE).containsMatchIn(body)
    if (debit == credit) return false
    val amounts = Regex("""(?:\b(?:inr|rupees?)\b|rs\.?|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?![0-9.])""", RegexOption.IGNORE_CASE).findAll(body).filter { match ->
      val before = body.substring(maxOf(0, match.range.first - 70), match.range.first)
      !Regex("""\b(?:bal(?:ance)?|limit)\.?\s*(?:(?:is|of)\s*)?[:=-]?\s*$""", RegexOption.IGNORE_CASE).containsMatchIn(before)
    }.toList()
    if (amounts.size != 1) return false
    val rawAmount = amounts[0].groupValues[1]
    if (!Regex("""^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$""").matches(rawAmount)) return false
    return (rawAmount.replace(",", "").toDoubleOrNull() ?: 0.0) > 0
  }
}
