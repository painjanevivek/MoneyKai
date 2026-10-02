package com.moneykai.nativecapture

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.security.MessageDigest

class MoneyKaiNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val notification = sbn?.notification ?: return
    val sourcePackage = sbn.packageName ?: return
    if (!MoneyKaiNativeCaptureModule.isPaymentNotificationAllowed(applicationContext, sourcePackage)) return
    if (sourcePackage == packageName) return
    if (!MoneyKaiNativeCaptureModule.isCaptureEnabled(applicationContext)) return
    if (!MoneyKaiNativeCaptureModule.isNotificationCaptureEnabled(applicationContext)) return
    if ((notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0) return

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

    if (isNotificationContentHidden(body, notification)) return

    if (body.isBlank() || !MoneyKaiPaymentNotificationPolicy.eligible("$title $body")) {
      return
    }
    val safeTitle = sanitizeNotificationText(title).take(120)
    val safeBody = sanitizeNotificationText(body).take(500)

    MoneyKaiNativeCaptureModule.handleNotificationSignal(
      applicationContext,
      Bundle().apply {
        putString("source", "notification")
        putString("title", safeTitle)
        putString("body", safeBody)
        putString("sourceApp", resolveAppLabel(sourcePackage))
        putString("receivedAt", toIsoUtc(sbn.postTime))
        putString("rawPackageName", sourcePackage)
        // Notification keys may contain private app tags: persist only a digest.
        putString("notificationId", MessageDigest.getInstance("SHA-256").digest("${sbn.key}|${sbn.postTime}|$title|$body".toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) })
        MoneyKaiSmsAutoRecord.referenceHash("$title $body")?.let { putString("notificationReferenceHash", it) }
      }
    )
  }

  private fun looksLikeFinancialNotification(value: String): Boolean {
    val text = value.lowercase(Locale.US)
    val hasMoneySignal = moneyTerms.any { text.contains(it) } || amountPattern.containsMatchIn(text)
    val hasTransactionSignal = transactionTerms.any { text.contains(it) }
    return hasMoneySignal && hasTransactionSignal
  }

  private fun isNotificationContentHidden(body: String, notification: Notification): Boolean {
    if (notification.visibility == Notification.VISIBILITY_SECRET) {
      return true
    }

    val text = body.lowercase(Locale.US)
    return body.isBlank() || hiddenContentTerms.any { text.contains(it) }
  }

  private fun looksLikeFinancialNotificationSource(title: String, packageName: String): Boolean {
    val text = "$title $packageName".lowercase(Locale.US)
    return financialSourceTerms.any { text.contains(it) }
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

  private fun sanitizeNotificationText(value: String): String =
    value
      .replace(Regex("""\b(?:xx|x{2,})\d+\b""", RegexOption.IGNORE_CASE), "[masked]")
      .replace(Regex("""[a-z0-9._%+-]+@[a-z0-9.-]+\b""", RegexOption.IGNORE_CASE), "[vpa]")
      .replace(
        Regex("""\b((?:upi\s*)?(?:ref(?:erence)?|rrn|utr|transaction id|txn id|order id|imps)\s*(?:no\.?|number|id)?\s*[:#-]?)\s*[a-z0-9/-]{6,}""", RegexOption.IGNORE_CASE),
        "$1 [ref]"
      )
      .replace(Regex("""\b\d{8,}\b"""), "[number]")

  companion object {
    private val amountPattern = Regex("""(?:rs\.?|inr|usd|eur|gbp|aed|\u20B9|\$)\s*\d""")
    private val moneyTerms = listOf("rs", "inr", "\u20B9", "upi", "card", "account", "wallet", "bank")
    private val hiddenContentTerms = listOf(
      "content hidden",
      "hidden content",
      "message hidden",
      "sensitive content hidden",
      "unlock to view"
    )
    private val financialSourceTerms = listOf(
      "axis",
      "hdfc",
      "icici",
      "sbi",
      "kotak",
      "yes bank",
      "idfc",
      "indusind",
      "canara",
      "pnb",
      "bank",
      "upi",
      "gpay",
      "google pay",
      "phonepe",
      "paytm",
      "bhim",
      "cred",
      "fi money",
      "jupiter"
    )
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
