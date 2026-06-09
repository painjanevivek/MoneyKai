package com.moneykai.nativecapture

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class MoneyKaiNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val notification = sbn?.notification ?: return
    val sourcePackage = sbn.packageName ?: return
    if (sourcePackage == packageName) return
    if (!MoneyKaiNativeCaptureModule.isCaptureEnabled(applicationContext)) return

    val title = notification.extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
    val text = notification.extras.getCharSequence(Notification.EXTRA_TEXT)?.toString().orEmpty()
    val bigText = notification.extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString().orEmpty()
    val subText = notification.extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString().orEmpty()
    val textLines = notification.extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
      ?.joinToString(" ") { it.toString() }
      .orEmpty()
    val body = listOf(text, bigText, subText, textLines)
      .filter { it.isNotBlank() }
      .distinct()
      .joinToString(" ")
      .trim()

    if (body.isBlank() || !looksLikeFinancialNotification("$title $body")) {
      return
    }

    MoneyKaiNativeCaptureModule.handleNotificationSignal(
      applicationContext,
      Bundle().apply {
        putString("source", "notification")
        putString("title", title)
        putString("body", body)
        putString("sourceApp", resolveAppLabel(sourcePackage))
        putString("receivedAt", toIsoUtc(sbn.postTime))
        putString("rawPackageName", sourcePackage)
      }
    )
  }

  private fun looksLikeFinancialNotification(value: String): Boolean {
    val text = value.lowercase(Locale.US)
    val hasMoneySignal = moneyTerms.any { text.contains(it) } || amountPattern.containsMatchIn(text)
    val hasTransactionSignal = transactionTerms.any { text.contains(it) }
    return hasMoneySignal && hasTransactionSignal
  }

  private fun toIsoUtc(timestamp: Long): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("UTC")
    return formatter.format(Date(timestamp))
  }

  private fun resolveAppLabel(packageName: String): String =
    runCatching {
      val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
      packageManager.getApplicationLabel(applicationInfo).toString()
    }.getOrElse { packageName }

  companion object {
    private val amountPattern = Regex("""(?:rs\.?|inr|usd|eur|gbp|aed|\u20B9|\$)\s*\d""")
    private val moneyTerms = listOf("rs", "inr", "\u20B9", "upi", "card", "account", "wallet", "bank")
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
  }
}
