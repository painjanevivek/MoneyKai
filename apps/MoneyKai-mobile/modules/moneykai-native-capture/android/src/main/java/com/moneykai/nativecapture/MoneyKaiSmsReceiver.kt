package com.moneykai.nativecapture

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony

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

    if (body.isBlank() || !MoneyKaiSmsFilters.shouldImportSms(sender, body)) return
    val accountId = MoneyKaiSmsFilters.buildAccountId(sender, body)
    val accountApproved = MoneyKaiNativeCaptureModule.isSmsAccountApproved(context, accountId)

    MoneyKaiNativeCaptureModule.handleNativeSignal(
      context,
      Bundle().apply {
        putString("source", "sms")
        putString("sender", MoneyKaiSmsFilters.sanitizeSmsText(sender))
        putString(
          "body",
          if (accountApproved) MoneyKaiSmsFilters.sanitizeSmsText(body) else "Bank account approval preview"
        )
        putString("receivedAt", MoneyKaiSmsFilters.toIsoUtc(receivedAt))
        putString(
          "captureOrigin",
          if (accountApproved) "android_sms_receiver" else "android_sms_account_discovery"
        )
        putString("rawBodyStored", "false")
        MoneyKaiSmsFilters.extractAccountHint(body)?.let { putString("smsAccountHint", it) }
        putString("smsSubscriptionId", readIntentExtra(intent, "subscription"))
        putString("smsSlot", readIntentExtra(intent, "slot"))
        putString("smsPhoneId", readIntentExtra(intent, "phone"))
      }
    )
  }

  private fun readIntentExtra(intent: Intent, key: String): String? {
    if (!intent.hasExtra(key)) return null
    val value = intent.getStringExtra(key)
      ?: intent.getIntExtra(key, UNKNOWN_INT_EXTRA).takeIf { it != UNKNOWN_INT_EXTRA }?.toString()
      ?: intent.getLongExtra(key, UNKNOWN_LONG_EXTRA).takeIf { it != UNKNOWN_LONG_EXTRA }?.toString()
      ?: intent.getBooleanExtra(key, false).toString()
    return value.take(MAX_SMS_META_LENGTH)
  }

  companion object {
    private const val MAX_SMS_META_LENGTH = 32
    private const val UNKNOWN_INT_EXTRA = Int.MIN_VALUE
    private const val UNKNOWN_LONG_EXTRA = Long.MIN_VALUE
  }
}
