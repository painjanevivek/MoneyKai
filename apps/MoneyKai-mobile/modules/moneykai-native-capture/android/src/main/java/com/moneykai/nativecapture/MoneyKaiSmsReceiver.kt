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

    MoneyKaiNativeCaptureModule.handleNativeSignal(
      context,
      Bundle().apply {
        putString("source", "sms")
        putString("sender", MoneyKaiSmsFilters.sanitizeSmsText(sender))
        putString("body", MoneyKaiSmsFilters.sanitizeSmsText(body))
        putString("receivedAt", MoneyKaiSmsFilters.toIsoUtc(receivedAt))
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

  companion object {
    private const val MAX_SMS_META_LENGTH = 32
  }
}
