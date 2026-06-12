package com.moneykai.nativecapture

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.provider.Telephony
import android.text.TextUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MoneyKaiNativeCaptureModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "MoneyKaiNativeCapture"

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun startListening(): Boolean {
    activeModule = this
    flushPendingSignals(reactContext)
    return true
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun stopListening(): Boolean {
    if (activeModule === this) {
      activeModule = null
    }
    return true
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun clearPendingSignals(): Boolean {
    clearPendingSignals(reactContext)
    return true
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setCaptureEnabled(enabled: Boolean): Boolean {
    setCaptureEnabled(reactContext, enabled)
    if (!enabled) {
      clearPendingSignals(reactContext)
    }
    return true
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setCaptureSourcesEnabled(notificationEnabled: Boolean, smsEnabled: Boolean): Boolean {
    setCaptureSourcesEnabled(reactContext, notificationEnabled, smsEnabled)
    if (!notificationEnabled && !smsEnabled) {
      clearPendingSignals(reactContext)
    }
    return true
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setApprovedSmsAccounts(approvedAccountIdsJson: String): Boolean {
    setApprovedSmsAccounts(reactContext, approvedAccountIdsJson)
    return true
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getStatus(): WritableMap {
    activeModule = this
    return Arguments.createMap().apply {
      putString("platform", "android")
      putBoolean("nativeModuleAvailable", true)
      putString("notificationAccess", if (isNotificationListenerEnabled(reactContext)) "granted" else "not_requested")
      putString("smsAccess", getSmsAccessStatus(reactContext))
      putString("smsInboxAccess", getSmsInboxAccessStatus(reactContext))
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun discoverRecentSmsAccounts(days: Int, maxMessages: Int): String =
    discoverRecentSmsAccounts(reactContext, days, maxMessages)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun importRecentSmsTransactions(days: Int, maxMessages: Int, approvedAccountIdsJson: String): String =
    importRecentSmsTransactions(reactContext, days, maxMessages, approvedAccountIdsJson)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun openNotificationListenerSettings(): Boolean {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    return try {
      reactContext.startActivity(intent)
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }

  @ReactMethod
  fun getDefaultWebClientId(promise: Promise) {
    val resourceId = reactContext.resources.getIdentifier(
      "default_web_client_id",
      "string",
      reactContext.packageName
    )
    if (resourceId == 0) {
      promise.resolve("")
      return
    }

    val webClientId = runCatching { reactContext.getString(resourceId) }.getOrDefault("")
    promise.resolve(webClientId)
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Int) = Unit

  private fun sendEvent(eventName: String, event: Bundle) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, Arguments.fromBundle(event))
  }

  companion object {
    private const val MAX_PENDING_SIGNALS = 50
    private const val PREFS_NAME = "moneykai_native_capture"
    private const val PREFS_PENDING_SIGNALS = "pending_notification_signals"
    private const val PREFS_CAPTURE_ENABLED = "capture_enabled"
    private const val PREFS_NOTIFICATION_CAPTURE_ENABLED = "notification_capture_enabled"
    private const val PREFS_SMS_CAPTURE_ENABLED = "sms_capture_enabled"
    private const val PREFS_APPROVED_SMS_ACCOUNT_IDS = "approved_sms_account_ids"
    private const val MAX_SMS_IMPORT_DAYS = 31
    private const val MAX_SMS_IMPORT_SCAN_COUNT = 300
    private const val MAX_SMS_IMPORT_SIGNAL_COUNT = 100
    private const val MAX_SMS_META_LENGTH = 32
    private val SMS_INBOX_URI: Uri = Uri.parse("content://sms/inbox")

    private var activeModule: MoneyKaiNativeCaptureModule? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    fun handleNotificationSignal(context: Context, event: Bundle) {
      if (!isCaptureEnabled(context) || !isNotificationCaptureEnabled(context)) {
        return
      }

      handleNativeSignal(context, event)
    }

    fun handleNativeSignal(context: Context, event: Bundle) {
      if (!isCaptureEnabled(context)) {
        return
      }

      if (activeModule == null) {
        enqueuePendingSignal(context, event)
        return
      }

      emitNotificationSignal(event)
    }

    private fun emitNotificationSignal(event: Bundle) {
      val module = activeModule ?: return
      mainHandler.post {
        if (activeModule === module) {
          module.sendEvent("onNotificationSignal", event)
        }
      }
    }

    private fun flushPendingSignals(context: Context) {
      val pendingSignals = readPendingSignals(context)
      if (pendingSignals.isEmpty()) {
        return
      }

      clearPendingSignals(context)
      pendingSignals.forEach { emitNotificationSignal(it) }
    }

    private fun enqueuePendingSignal(context: Context, event: Bundle) {
      val pendingSignals = readPendingSignalJson(context)
      val trimmedSignals = JSONArray()
      val startIndex = maxOf(0, pendingSignals.length() - MAX_PENDING_SIGNALS + 1)

      for (index in startIndex until pendingSignals.length()) {
        trimmedSignals.put(pendingSignals.get(index))
      }
      trimmedSignals.put(bundleToJson(event))

      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(PREFS_PENDING_SIGNALS, trimmedSignals.toString())
        .apply()
    }

    private fun readPendingSignals(context: Context): List<Bundle> {
      val pendingSignals = readPendingSignalJson(context)
      return buildList {
        for (index in 0 until pendingSignals.length()) {
          pendingSignals.optJSONObject(index)?.let { add(jsonToBundle(it)) }
        }
      }
    }

    private fun readPendingSignalJson(context: Context): JSONArray {
      val rawValue = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(PREFS_PENDING_SIGNALS, null)

      return if (rawValue.isNullOrBlank()) {
        JSONArray()
      } else {
        runCatching { JSONArray(rawValue) }.getOrElse { JSONArray() }
      }
    }

    private fun clearPendingSignals(context: Context) {
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .remove(PREFS_PENDING_SIGNALS)
        .apply()
    }

    private fun setCaptureEnabled(context: Context, enabled: Boolean) {
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(PREFS_CAPTURE_ENABLED, enabled)
        .putBoolean(PREFS_NOTIFICATION_CAPTURE_ENABLED, enabled)
        .putBoolean(PREFS_SMS_CAPTURE_ENABLED, false)
        .apply()
    }

    private fun setCaptureSourcesEnabled(context: Context, notificationEnabled: Boolean, smsEnabled: Boolean) {
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(PREFS_CAPTURE_ENABLED, notificationEnabled || smsEnabled)
        .putBoolean(PREFS_NOTIFICATION_CAPTURE_ENABLED, notificationEnabled)
        .putBoolean(PREFS_SMS_CAPTURE_ENABLED, smsEnabled)
        .apply()
    }

    private fun setApprovedSmsAccounts(context: Context, approvedAccountIdsJson: String) {
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(PREFS_APPROVED_SMS_ACCOUNT_IDS, approvedAccountIdsJson)
        .apply()
    }

    fun isCaptureEnabled(context: Context): Boolean =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(PREFS_CAPTURE_ENABLED, false)

    private fun isNotificationCaptureEnabled(context: Context): Boolean =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(PREFS_NOTIFICATION_CAPTURE_ENABLED, isCaptureEnabled(context))

    fun isSmsCaptureEnabled(context: Context): Boolean =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(PREFS_SMS_CAPTURE_ENABLED, false)

    fun isSmsAccountApproved(context: Context, accountId: String?): Boolean {
      if (accountId.isNullOrBlank()) return false

      val rawValue = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(PREFS_APPROVED_SMS_ACCOUNT_IDS, "[]")
        .orEmpty()

      return parseApprovedAccountIds(rawValue).any { approvedId ->
        accountIdsCompatible(approvedId, accountId)
      }
    }

    private fun bundleToJson(bundle: Bundle): JSONObject {
      val json = JSONObject()
      bundle.keySet().forEach { key ->
        json.put(key, bundle.getString(key))
      }
      return json
    }

    private fun jsonToBundle(json: JSONObject): Bundle =
      Bundle().apply {
        json.keys().forEach { key ->
          putString(key, json.optString(key))
        }
      }

    fun isNotificationListenerEnabled(context: Context): Boolean {
      val enabledListeners = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners"
      )
      if (enabledListeners.isNullOrBlank()) {
        return false
      }

      val expected = ComponentName(
        context,
        MoneyKaiNotificationListenerService::class.java
      ).flattenToString()

      return TextUtils.split(enabledListeners, ":").any { listener ->
        listener.equals(expected, ignoreCase = true)
      }
    }

    private fun isSmsReceiverDeclared(context: Context): Boolean {
      val intent = Intent(Telephony.Sms.Intents.SMS_RECEIVED_ACTION).setPackage(context.packageName)
      return context.packageManager.queryBroadcastReceivers(intent, 0).any { receiver ->
        receiver.activityInfo?.name == MoneyKaiSmsReceiver::class.java.name
      }
    }

    private fun getSmsAccessStatus(context: Context): String {
      if (!isSmsReceiverDeclared(context)) {
        return "unsupported"
      }

      return if (context.checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED) {
        "granted"
      } else {
        "denied"
      }
    }

    private fun getSmsInboxAccessStatus(context: Context): String {
      if (!isSmsReceiverDeclared(context)) {
        return "unsupported"
      }

      return if (context.checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED) {
        "granted"
      } else {
        "denied"
      }
    }

    private fun discoverRecentSmsAccounts(context: Context, days: Int, maxMessages: Int): String {
      if (!isSmsReceiverDeclared(context)) {
        return buildSmsAccountDiscoveryResult("unsupported", "SMS research receiver is not available in this build.")
      }

      if (context.checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
        return buildSmsAccountDiscoveryResult("permission_denied", "Android SMS inbox permission has not been granted.")
      }

      val importDays = days.coerceIn(1, MAX_SMS_IMPORT_DAYS)
      val scanLimit = maxMessages.coerceIn(1, MAX_SMS_IMPORT_SCAN_COUNT)
      val sinceMillis = System.currentTimeMillis() - TimeUnit.DAYS.toMillis(importDays.toLong())
      val accountsById = linkedMapOf<String, JSONObject>()
      var scannedCount = 0
      var ignoredCount = 0

      return try {
        val cursor = context.contentResolver.query(
          SMS_INBOX_URI,
          arrayOf("address", "body", "date"),
          "date >= ?",
          arrayOf(sinceMillis.toString()),
          "date DESC"
        )

        cursor?.use {
          val addressIndex = it.getColumnIndex("address")
          val bodyIndex = it.getColumnIndex("body")
          val dateIndex = it.getColumnIndex("date")

          while (it.moveToNext() && scannedCount < scanLimit) {
            scannedCount += 1
            val sender = it.getStringOrBlank(addressIndex)
            val body = it.getStringOrBlank(bodyIndex)
            val receivedAt = it.getLongOrNull(dateIndex) ?: System.currentTimeMillis()

            if (body.isBlank() || !MoneyKaiSmsFilters.shouldImportSms(sender, body)) {
              ignoredCount += 1
              continue
            }

            val accountId = MoneyKaiSmsFilters.buildAccountId(sender, body)
            if (accountId.isNullOrBlank()) {
              ignoredCount += 1
              continue
            }

            val existing = accountsById[accountId]
            if (existing == null) {
              val account = JSONObject()
                .put("source", "sms")
                .put("sender", MoneyKaiSmsFilters.sanitizeSmsText(sender))
                .put("sampleCount", 1)
                .put("lastSeenAt", MoneyKaiSmsFilters.toIsoUtc(receivedAt))

              MoneyKaiSmsFilters.extractAccountHint(body)?.let { value ->
                account.put("smsAccountHint", value)
              }
              accountsById[accountId] = account
            } else {
              existing.put("sampleCount", existing.optInt("sampleCount", 1) + 1)
            }
          }
        }

        buildSmsAccountDiscoveryResult(
          status = "imported",
          accounts = JSONArray(accountsById.values),
          scannedCount = scannedCount,
          ignoredCount = ignoredCount
        )
      } catch (error: SecurityException) {
        buildSmsAccountDiscoveryResult("permission_denied", error.message ?: "Android denied SMS inbox access.")
      } catch (error: Exception) {
        buildSmsAccountDiscoveryResult("error", error.message ?: "Unable to discover SMS accounts.")
      }
    }

    private fun importRecentSmsTransactions(context: Context, days: Int, maxMessages: Int, approvedAccountIdsJson: String): String {
      if (!isSmsReceiverDeclared(context)) {
        return buildSmsImportResult("unsupported", "SMS research receiver is not available in this build.")
      }

      if (context.checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
        return buildSmsImportResult("permission_denied", "Android SMS inbox permission has not been granted.")
      }

      val approvedAccountIds = parseApprovedAccountIds(approvedAccountIdsJson)
      if (approvedAccountIds.isEmpty()) {
        return buildSmsImportResult("imported", "Approve at least one bank account before importing SMS transactions.")
      }

      val importDays = days.coerceIn(1, MAX_SMS_IMPORT_DAYS)
      val scanLimit = maxMessages.coerceIn(1, MAX_SMS_IMPORT_SCAN_COUNT)
      val sinceMillis = System.currentTimeMillis() - TimeUnit.DAYS.toMillis(importDays.toLong())
      val signals = JSONArray()
      var scannedCount = 0
      var ignoredCount = 0

      return try {
        val cursor = context.contentResolver.query(
          SMS_INBOX_URI,
          arrayOf("_id", "address", "body", "date", "sub_id"),
          "date >= ?",
          arrayOf(sinceMillis.toString()),
          "date DESC"
        )

        cursor?.use {
          val idIndex = it.getColumnIndex("_id")
          val addressIndex = it.getColumnIndex("address")
          val bodyIndex = it.getColumnIndex("body")
          val dateIndex = it.getColumnIndex("date")
          val subscriptionIndex = it.getColumnIndex("sub_id")

          while (it.moveToNext() && scannedCount < scanLimit && signals.length() < MAX_SMS_IMPORT_SIGNAL_COUNT) {
            scannedCount += 1
            val sender = it.getStringOrBlank(addressIndex)
            val body = it.getStringOrBlank(bodyIndex)
            val receivedAt = it.getLongOrNull(dateIndex) ?: System.currentTimeMillis()

            if (body.isBlank() || !MoneyKaiSmsFilters.shouldImportSms(sender, body)) {
              ignoredCount += 1
              continue
            }

            val accountId = MoneyKaiSmsFilters.buildAccountId(sender, body)
            if (accountId.isNullOrBlank() || approvedAccountIds.none { approvedId -> accountIdsCompatible(approvedId, accountId) }) {
              ignoredCount += 1
              continue
            }

            val signal = JSONObject()
              .put("source", "sms")
              .put("sender", MoneyKaiSmsFilters.sanitizeSmsText(sender))
              .put("body", MoneyKaiSmsFilters.sanitizeSmsText(body))
              .put("receivedAt", MoneyKaiSmsFilters.toIsoUtc(receivedAt))
              .put("captureOrigin", "android_sms_inbox_import")
              .put("rawBodyStored", "false")

            MoneyKaiSmsFilters.extractAccountHint(body)?.let { value ->
              signal.put("smsAccountHint", value)
            }
            it.getStringOrNull(idIndex)?.let { value ->
              signal.put("smsMessageId", value.take(MAX_SMS_META_LENGTH))
            }
            it.getStringOrNull(subscriptionIndex)?.let { value ->
              signal.put("smsSubscriptionId", value.take(MAX_SMS_META_LENGTH))
            }

            signals.put(signal)
          }
        }

        buildSmsImportResult(
          status = "imported",
          signals = signals,
          scannedCount = scannedCount,
          ignoredCount = ignoredCount
        )
      } catch (error: SecurityException) {
        buildSmsImportResult("permission_denied", error.message ?: "Android denied SMS inbox access.")
      } catch (error: Exception) {
        buildSmsImportResult("error", error.message ?: "Unable to import SMS messages.")
      }
    }

    private fun parseApprovedAccountIds(rawValue: String): Set<String> =
      runCatching {
        val values = JSONArray(rawValue)
        buildSet {
          for (index in 0 until values.length()) {
            values.optString(index).takeIf { it.isNotBlank() }?.let { add(it) }
          }
        }
      }.getOrElse { emptySet() }

    private fun accountIdsCompatible(approvedId: String, candidateId: String): Boolean {
      if (approvedId == candidateId) return true

      val approvedParts = approvedId.split(":")
      val candidateParts = candidateId.split(":")
      if (approvedParts.size != 3 || candidateParts.size != 3) return false
      if (approvedParts[0] != "sms" || candidateParts[0] != "sms") return false

      val approvedBank = bankFamily(approvedParts[1])
      val candidateBank = bankFamily(candidateParts[1])
      val approvedAccount = approvedParts[2]
      val candidateAccount = candidateParts[2]

      return approvedAccount != "sender" &&
        candidateAccount != "sender" &&
        approvedAccount == candidateAccount &&
        approvedBank == candidateBank
    }

    private fun bankFamily(bankKey: String): String =
      when {
        bankKey.contains("sbi") -> "sbi"
        bankKey.contains("hdfc") -> "hdfc"
        bankKey.contains("icici") -> "icici"
        bankKey.contains("axis") -> "axis"
        bankKey.contains("kotak") -> "kotak"
        bankKey.contains("yes") -> "yes"
        bankKey.contains("idfc") -> "idfc"
        bankKey.contains("indus") -> "indus"
        bankKey.contains("federal") -> "federal"
        else -> bankKey
      }

    private fun Cursor.getStringOrBlank(index: Int): String =
      getStringOrNull(index).orEmpty()

    private fun Cursor.getStringOrNull(index: Int): String? =
      if (index >= 0 && !isNull(index)) getString(index) else null

    private fun Cursor.getLongOrNull(index: Int): Long? =
      if (index >= 0 && !isNull(index)) getLong(index) else null

    private fun buildSmsImportResult(
      status: String,
      message: String? = null,
      signals: JSONArray = JSONArray(),
      scannedCount: Int = 0,
      ignoredCount: Int = 0
    ): String {
      val result = JSONObject()
        .put("status", status)
        .put("signals", signals)
        .put("importedCount", signals.length())
        .put("scannedCount", scannedCount)
        .put("ignoredCount", ignoredCount)

      if (!message.isNullOrBlank()) {
        result.put("message", message)
      }

      return result.toString()
    }

    private fun buildSmsAccountDiscoveryResult(
      status: String,
      message: String? = null,
      accounts: JSONArray = JSONArray(),
      scannedCount: Int = 0,
      ignoredCount: Int = 0
    ): String {
      val result = JSONObject()
        .put("status", status)
        .put("accounts", accounts)
        .put("discoveredCount", accounts.length())
        .put("scannedCount", scannedCount)
        .put("ignoredCount", ignoredCount)

      if (!message.isNullOrBlank()) {
        result.put("message", message)
      }

      return result.toString()
    }
  }
}
