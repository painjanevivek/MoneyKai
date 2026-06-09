package com.moneykai.nativecapture

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class MoneyKaiSmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    if (!MoneyKaiNativeCaptureModule.isCaptureEnabled(context)) return
    if (!MoneyKaiNativeCaptureModule.isSmsCaptureEnabled(context)) return

    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    if (messages.isNullOrEmpty()) return

    val sender = messages.firstOrNull()?.originatingAddress.orEmpty()
    val receivedAt = messages.minOfOrNull { it.timestampMillis } ?: System.currentTimeMillis()
    val body = messages.joinToString(separator = "") { message -> message.messageBody.orEmpty() }.trim()

    if (body.isBlank() || !looksLikeFinancialSms(body)) return

    MoneyKaiNativeCaptureModule.handleNativeSignal(
      context,
      Bundle().apply {
        putString("source", "sms")
        putString("sender", sanitizeSmsText(sender))
        putString("body", sanitizeSmsText(body))
        putString("receivedAt", toIsoUtc(receivedAt))
        putString("captureOrigin", "android_sms_receiver")
        putString("rawBodyStored", "false")
        putString("smsSubscriptionId", readIntentExtra(intent, "subscription"))
        putString("smsSlot", readIntentExtra(intent, "slot"))
        putString("smsPhoneId", readIntentExtra(intent, "phone"))
      }
    )
  }

  private fun readIntentExtra(intent: Intent, key: String): String? {
    val value = intent.extras?.get(key) ?: return null
    return value.toString().take(MAX_SMS_META_LENGTH)
  }

  private fun looksLikeFinancialSms(value: String): Boolean {
    val text = value.lowercase(Locale.US)
    val hasMoneySignal = moneyTerms.any { text.contains(it) } || amountPattern.containsMatchIn(text)
    val hasTransactionSignal = transactionTerms.any { text.contains(it) }
    val hasNoiseSignal = noiseTerms.any { text.contains(it) }
    return hasMoneySignal && hasTransactionSignal && !hasNoiseSignal
  }

  private fun sanitizeSmsText(value: String): String =
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

  private fun toIsoUtc(timestamp: Long): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("UTC")
    return formatter.format(Date(timestamp))
  }

  companion object {
    private const val MAX_SMS_FIELD_LENGTH = 500
    private const val MAX_SMS_META_LENGTH = 32
    private val amountPattern = Regex("""(?:rs\.?|inr|\u20B9)\s*\d""")
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
      "statement"
    )
  }
}
