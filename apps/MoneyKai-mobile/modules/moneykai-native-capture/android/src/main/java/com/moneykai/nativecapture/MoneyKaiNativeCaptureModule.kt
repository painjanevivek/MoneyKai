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
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import java.util.concurrent.Executors

class MoneyKaiNativeCaptureModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val smsExecutor = Executors.newSingleThreadExecutor()
  private val statementReader = MoneyKaiStatementReader(reactContext)

  @ReactMethod
  fun pickPaymentStatement(promise: Promise) = statementReader.pick(promise)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setPaymentNotificationPackages(packagesJson: String, ownerId: String): Boolean {
    val packages = JSONArray(packagesJson)
    val selected = (0 until packages.length()).map { packages.getString(it) }
      .filter { ownerId.isNotBlank() && it in PAYMENT_APP_PACKAGES }.toSet()
    return reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
      .putStringSet("payment_notification_packages", selected)
      .putString("payment_notification_owner", ownerId).commit()
  }
  @ReactMethod
  fun configureSmsSchedule(enabled: Boolean, intervalMinutes: Double, ownerId: String, promise: Promise) {
    smsExecutor.execute {
      try { promise.resolve(MoneyKaiSmsSchedule.configure(reactContext, enabled, intervalMinutes.toInt(), ownerId)) }
      catch (_: Exception) { promise.resolve(false) }
    }
  }
  override fun getName(): String = "MoneyKaiNativeCapture"

  @ReactMethod
  fun getPrivateItem(name: String, promise: Promise) {
    try { promise.resolve(MoneyKaiPrivateStorage.get(reactContext, name)) }
    catch (_: Exception) { promise.reject("PRIVATE_STORAGE_UNAVAILABLE", "Encrypted device storage could not be read.") }
  }

  @ReactMethod
  fun setPrivateItem(name: String, value: String, promise: Promise) {
    try { MoneyKaiPrivateStorage.set(reactContext, name, value); promise.resolve(null) }
    catch (_: Exception) { promise.reject("PRIVATE_STORAGE_UNAVAILABLE", "Encrypted device storage could not be written.") }
  }

  @ReactMethod
  fun removePrivateItem(name: String, promise: Promise) {
    try { MoneyKaiPrivateStorage.remove(reactContext, name); promise.resolve(null) }
    catch (_: Exception) { promise.reject("PRIVATE_STORAGE_UNAVAILABLE", "Encrypted device storage could not be removed.") }
  }

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
    return Arguments.createMap().apply {
      putString("platform", "android")
      putBoolean("nativeModuleAvailable", true)
      putBoolean("notificationCaptureAvailable", runCatching {
        reactContext.packageManager.getServiceInfo(ComponentName(reactContext, MoneyKaiNotificationListenerService::class.java), 0)
        true
      }.getOrDefault(false))
      putString(
        "notificationAccess",
        if (isNotificationListenerEnabled(reactContext)) "granted" else "not_requested"
      )
      putString("smsAccess", getSmsAccessStatus(reactContext))
      putString("smsInboxAccess", getSmsInboxAccessStatus(reactContext))
    }
  }

  @ReactMethod
  fun discoverRecentSmsAccounts(optionsJson: String, promise: Promise) {
    smsExecutor.execute {
      try { promise.resolve(discoverRecentSmsAccounts(reactContext, optionsJson)) }
      catch (_: Exception) { promise.reject("SMS_DISCOVERY_FAILED", "Could not scan bank messages on this device.") }
    }
  }

  @ReactMethod
  fun importRecentSmsTransactions(optionsJson: String, approvedAccountIdsJson: String, promise: Promise) {
    smsExecutor.execute {
      try { promise.resolve(importRecentSmsTransactions(reactContext, optionsJson, approvedAccountIdsJson)) }
      catch (_: Exception) { promise.reject("SMS_IMPORT_FAILED", "Could not import bank messages on this device.") }
    }
  }

  override fun invalidate() {
    statementReader.close()
    smsExecutor.shutdownNow()
    if (activeModule === this) activeModule = null
    super.invalidate()
  }

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
    private val PAYMENT_APP_PACKAGES = setOf("com.google.android.apps.nbu.paisa.user", "com.phonepe.app", "net.one97.paytm")

    fun isPaymentNotificationAllowed(context: Context, packageName: String): Boolean =
      packageName in PAYMENT_APP_PACKAGES && context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getStringSet("payment_notification_packages", emptySet())?.contains(packageName) == true
        && paymentNotificationOwner(context).isNotBlank()

    fun paymentNotificationOwner(context: Context): String =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString("payment_notification_owner", "").orEmpty()
    private const val MAX_PENDING_SIGNALS = 1000
    private const val PREFS_NAME = "moneykai_native_capture"
    private const val PREFS_PENDING_SIGNALS = "pending_notification_signals"
    private const val PREFS_CAPTURE_ENABLED = "capture_enabled"
    private const val PREFS_NOTIFICATION_CAPTURE_ENABLED = "notification_capture_enabled"
    private const val PREFS_SMS_CAPTURE_ENABLED = "sms_capture_enabled"
    private const val PREFS_APPROVED_SMS_ACCOUNT_IDS = "approved_sms_account_ids"
    private const val MAX_SMS_IMPORT_DAYS = 366
    private const val MAX_SMS_IMPORT_SCAN_COUNT = 10000
    private const val MAX_SMS_IMPORT_SIGNAL_COUNT = 100
    private const val MAX_SMS_IMPORT_PAGE_SIZE = 500
    private const val MAX_SMS_META_LENGTH = 32
    private val SMS_INBOX_URI: Uri = Uri.parse("content://sms/inbox")

    private var activeModule: MoneyKaiNativeCaptureModule? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    fun handleNotificationSignal(context: Context, event: Bundle) {
      if (!isCaptureEnabled(context) || !isNotificationCaptureEnabled(context)) {
        return
      }

      if (!isPaymentNotificationAllowed(context, event.getString("rawPackageName").orEmpty())) return
      event.putString("notificationOwnerId", paymentNotificationOwner(context))

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

    @Synchronized private fun flushPendingSignals(context: Context) {
      val pendingSignals = readPendingSignals(context)
      if (pendingSignals.isEmpty()) {
        return
      }

      clearPendingSignals(context)
      pendingSignals.forEach {
        if (it.getString("source") != "notification" ||
          (isNotificationCaptureEnabled(context) && isPaymentNotificationAllowed(context, it.getString("rawPackageName").orEmpty()) &&
            it.getString("notificationOwnerId") == paymentNotificationOwner(context))) emitNotificationSignal(it)
      }
    }

    @Synchronized private fun enqueuePendingSignal(context: Context, event: Bundle) {
      val pendingSignals = readPendingSignalJson(context)
      val trimmedSignals = JSONArray()
      val startIndex = maxOf(0, pendingSignals.length() - MAX_PENDING_SIGNALS + 1)

      for (index in startIndex until pendingSignals.length()) {
        trimmedSignals.put(pendingSignals.get(index))
      }
      trimmedSignals.put(bundleToJson(event))

      MoneyKaiPrivateStorage.set(context, "moneykai-pending-signals", trimmedSignals.toString())
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
      val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val rawValue = MoneyKaiPrivateStorage.get(context, "moneykai-pending-signals")
        ?: preferences.getString(PREFS_PENDING_SIGNALS, null)?.also {
          MoneyKaiPrivateStorage.set(context, "moneykai-pending-signals", it)
          check(preferences.edit().remove(PREFS_PENDING_SIGNALS).commit())
        }
      if (preferences.contains(PREFS_PENDING_SIGNALS)) {
        check(preferences.edit().remove(PREFS_PENDING_SIGNALS).commit())
      }

      return if (rawValue.isNullOrBlank()) {
        JSONArray()
      } else {
        runCatching { JSONArray(rawValue) }.getOrElse { JSONArray() }
      }
    }

    @Synchronized private fun clearPendingSignals(context: Context) {
      MoneyKaiPrivateStorage.remove(context, "moneykai-pending-signals")
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
      MoneyKaiSmsSchedule.configure(context, false, 60, "")
    }

    private fun setCaptureSourcesEnabled(context: Context, notificationEnabled: Boolean, smsEnabled: Boolean) {
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(PREFS_CAPTURE_ENABLED, notificationEnabled || smsEnabled)
        .putBoolean(PREFS_NOTIFICATION_CAPTURE_ENABLED, notificationEnabled)
        .putBoolean(PREFS_SMS_CAPTURE_ENABLED, smsEnabled)
        .apply()
      if (!smsEnabled) MoneyKaiSmsSchedule.configure(context, false, 60, "")
    }

    @Synchronized fun queueScheduledSignal(context: Context, event: Bundle): Boolean {
      if (!isCaptureEnabled(context) || !isSmsCaptureEnabled(context)) return false
      val pending = readPendingSignalJson(context)
      for (index in 0 until pending.length()) {
        val item = pending.optJSONObject(index) ?: continue
        if (item.optString("smsMessageId") == event.getString("smsMessageId") && item.optString("smsOwnerId") == event.getString("smsOwnerId")) return true
      }
      if (pending.length() >= MAX_PENDING_SIGNALS) return false
      pending.put(bundleToJson(event))
      MoneyKaiPrivateStorage.set(context, "moneykai-pending-signals", pending.toString())
      if (activeModule != null) flushPendingSignals(context)
      return true
    }

    private fun setApprovedSmsAccounts(context: Context, approvedAccountIdsJson: String) {
      MoneyKaiPrivateStorage.set(context, "moneykai-approved-sms-accounts", approvedAccountIdsJson)
      check(context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit().remove(PREFS_APPROVED_SMS_ACCOUNT_IDS).commit())
    }

    fun isCaptureEnabled(context: Context): Boolean =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(PREFS_CAPTURE_ENABLED, false)

    fun isNotificationCaptureEnabled(context: Context): Boolean =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(PREFS_NOTIFICATION_CAPTURE_ENABLED, isCaptureEnabled(context))

    fun isSmsCaptureEnabled(context: Context): Boolean =
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getBoolean(PREFS_SMS_CAPTURE_ENABLED, false)

    fun isSmsAccountApproved(context: Context, accountId: String?): Boolean {
      if (accountId.isNullOrBlank()) return false

      val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val rawValue = MoneyKaiPrivateStorage.get(context, "moneykai-approved-sms-accounts")
        ?: preferences.getString(PREFS_APPROVED_SMS_ACCOUNT_IDS, null)?.also {
          MoneyKaiPrivateStorage.set(context, "moneykai-approved-sms-accounts", it)
        } ?: "[]"
      if (preferences.contains(PREFS_APPROVED_SMS_ACCOUNT_IDS)) {
        check(preferences.edit().remove(PREFS_APPROVED_SMS_ACCOUNT_IDS).commit())
      }

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

    private data class SmsScanOptions(
      val rangeId: String,
      val sinceMillis: Long,
      val cursorPosition: MoneyKaiSmsPaging.Position?,
      val maxMessages: Int,
      val pageSize: Int
    )

    private fun discoverRecentSmsAccounts(context: Context, optionsJson: String): String {
      if (!isSmsReceiverDeclared(context)) {
        return buildSmsAccountDiscoveryResult("unsupported", "SMS research receiver is not available in this build.")
      }

      if (context.checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
        return buildSmsAccountDiscoveryResult("permission_denied", "Android SMS inbox permission has not been granted.")
      }

      val options = parseSmsScanOptions(optionsJson)
      val query = buildSmsQuery(options)
      val accountsById = linkedMapOf<String, JSONObject>()
      var scannedCount = 0
      var ignoredCount = 0
      var lastPosition: MoneyKaiSmsPaging.Position? = null

      return try {
        val cursor = context.contentResolver.query(
          SMS_INBOX_URI,
          arrayOf("_id", "address", "body", "date"),
          query.selection,
          query.selectionArgs,
          "date DESC, _id DESC"
        ) ?: return buildSmsAccountDiscoveryResult("error", "Android SMS inbox could not be opened. Try again.")

        cursor?.use {
          val idIndex = it.getColumnIndex("_id")
          val addressIndex = it.getColumnIndex("address")
          val bodyIndex = it.getColumnIndex("body")
          val dateIndex = it.getColumnIndex("date")

          while (it.moveToNext() && scannedCount < options.pageSize) {
            scannedCount += 1
            val sender = it.getStringOrBlank(addressIndex)
            val body = it.getStringOrBlank(bodyIndex)
            val receivedAt = it.getLongOrNull(dateIndex) ?: System.currentTimeMillis()
            lastPosition = MoneyKaiSmsPaging.Position(receivedAt, it.getLongOrNull(idIndex) ?: error("Missing SMS row ID"))

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
                .put("discoverySampleRedactedBody", MoneyKaiSmsFilters.sanitizeSmsText(body))
                .put("discoverySampleSender", MoneyKaiSmsFilters.sanitizeSmsText(sender))
                .put("discoverySampleReceivedAt", MoneyKaiSmsFilters.toIsoUtc(receivedAt))

              it.getStringOrNull(idIndex)?.let { value ->
                account.put("discoverySampleMessageId", value.take(MAX_SMS_META_LENGTH))
              }
              MoneyKaiSmsFilters.extractAccountHint(body)?.let { value ->
                account.put("smsAccountHint", value)
              }
              account.put("smsSampleSnippet", MoneyKaiSmsFilters.sanitizeSmsText(body))
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
          ignoredCount = ignoredCount,
          hasMore = lastPosition != null && scannedCount >= options.pageSize,
          nextCursor = lastPosition?.encode()
        )
      } catch (error: SecurityException) {
        buildSmsAccountDiscoveryResult("permission_denied", error.message ?: "Android denied SMS inbox access.")
      } catch (error: Exception) {
        buildSmsAccountDiscoveryResult("error", error.message ?: "Unable to discover SMS accounts.")
      }
    }

    private fun importRecentSmsTransactions(context: Context, optionsJson: String, approvedAccountIdsJson: String): String {
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

      val options = parseSmsScanOptions(optionsJson)
      val query = buildSmsQuery(options)
      val signals = JSONArray()
      var scannedCount = 0
      var ignoredCount = 0
      var lastPosition: MoneyKaiSmsPaging.Position? = null
      val signalLimit = minOf(MAX_SMS_IMPORT_SIGNAL_COUNT, options.pageSize)

      return try {
        val cursor = context.contentResolver.query(
          SMS_INBOX_URI,
          arrayOf("_id", "address", "body", "date", "sub_id"),
          query.selection,
          query.selectionArgs,
          "date DESC, _id DESC"
        ) ?: return buildSmsImportResult("error", "Android SMS inbox could not be opened. Try again.")

        cursor?.use {
          val idIndex = it.getColumnIndex("_id")
          val addressIndex = it.getColumnIndex("address")
          val bodyIndex = it.getColumnIndex("body")
          val dateIndex = it.getColumnIndex("date")
          val subscriptionIndex = it.getColumnIndex("sub_id")

          while (it.moveToNext() && scannedCount < options.pageSize && signals.length() < signalLimit) {
            scannedCount += 1
            val sender = it.getStringOrBlank(addressIndex)
            val body = it.getStringOrBlank(bodyIndex)
            val receivedAt = it.getLongOrNull(dateIndex) ?: System.currentTimeMillis()
            lastPosition = MoneyKaiSmsPaging.Position(receivedAt, it.getLongOrNull(idIndex) ?: error("Missing SMS row ID"))

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
               .put("smsAutoRecordSafe", MoneyKaiSmsAutoRecord.safe(body))
               .put("smsReferenceHash", MoneyKaiSmsAutoRecord.referenceHash(body))
              .put("receivedAt", MoneyKaiSmsFilters.toIsoUtc(receivedAt))
              .put("captureOrigin", "android_sms_inbox_import")
              .put("rawBodyStored", "false")
              .put("smsFingerprint", buildSmsFingerprint(sender, body, receivedAt))

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
          ignoredCount = ignoredCount,
          hasMore = lastPosition != null && MoneyKaiSmsPaging.reachedLimit(scannedCount, options.pageSize, signals.length(), signalLimit),
          nextCursor = lastPosition?.encode()
        )
      } catch (error: SecurityException) {
        buildSmsImportResult("permission_denied", error.message ?: "Android denied SMS inbox access.")
      } catch (error: Exception) {
        buildSmsImportResult("error", error.message ?: "Unable to import SMS messages.")
      }
    }

    private data class SmsQuery(
      val selection: String?,
      val selectionArgs: Array<String>?
    )

    private fun parseSmsScanOptions(optionsJson: String): SmsScanOptions {
      val options = runCatching { JSONObject(optionsJson) }.getOrElse { JSONObject() }
      val rangeId = options.optString("rangeId", "1_month")
      val rangeMaxMessages = when (rangeId) {
        "15_days" -> 250
        "1_month" -> 500
        "3_months" -> 1500
        "6_months" -> 3000
        "1_year" -> 6000
        "all" -> MAX_SMS_IMPORT_SCAN_COUNT
        else -> 500
      }.coerceAtMost(MAX_SMS_IMPORT_SCAN_COUNT)
      val requestedMaxMessages = options.optInt("maxMessages", rangeMaxMessages)
      val maxMessages = requestedMaxMessages.coerceIn(1, rangeMaxMessages)
      val requestedPageSize = options.optInt("pageSize", minOf(maxMessages, MAX_SMS_IMPORT_PAGE_SIZE))
      val pageSize = requestedPageSize.coerceIn(1, minOf(maxMessages, MAX_SMS_IMPORT_PAGE_SIZE))
      val explicitSinceMillis = options.optLong("sinceMillis", 0L)
      val requestedDays = options.optInt("days", 0)
      val days = requestedDays.coerceIn(0, MAX_SMS_IMPORT_DAYS)
      val sinceMillis = when {
        explicitSinceMillis > 0L -> explicitSinceMillis
        days > 0 -> System.currentTimeMillis() - TimeUnit.DAYS.toMillis(days.toLong())
        else -> 0L
      }
      val cursor = options.optString("cursor", "")
        .takeIf { it.isNotBlank() }
        ?.let { MoneyKaiSmsPaging.decode(it) }

      return SmsScanOptions(
        rangeId = rangeId,
        sinceMillis = sinceMillis,
        cursorPosition = cursor,
        maxMessages = maxMessages,
        pageSize = pageSize
      )
    }

    private fun buildSmsQuery(options: SmsScanOptions): SmsQuery {
      val clauses = mutableListOf<String>()
      val args = mutableListOf<String>()

      if (options.sinceMillis > 0L) {
        clauses.add("date >= ?")
        args.add(options.sinceMillis.toString())
      }

      options.cursorPosition?.let { cursor ->
        clauses.add(cursor.selection())
        args.addAll(cursor.args())
      }

      return SmsQuery(
        selection = clauses.takeIf { it.isNotEmpty() }?.joinToString(" AND "),
        selectionArgs = args.takeIf { it.isNotEmpty() }?.toTypedArray()
      )
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

    fun buildSmsFingerprint(sender: String, body: String, receivedAt: Long): String {
      val value = "${sender.trim().lowercase()}|${body.trim()}|$receivedAt"
      val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8))
      return digest.joinToString("") { byte -> "%02x".format(byte) }.take(32)
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
      ignoredCount: Int = 0,
      hasMore: Boolean = false,
      nextCursor: String? = null
    ): String {
      val result = JSONObject()
        .put("status", status)
        .put("signals", signals)
        .put("importedCount", signals.length())
        .put("scannedCount", scannedCount)
        .put("ignoredCount", ignoredCount)
        .put("hasMore", hasMore)

      if (!message.isNullOrBlank()) {
        result.put("message", message)
      }
      if (!nextCursor.isNullOrBlank() && hasMore) {
        result.put("nextCursor", nextCursor)
      }

      return result.toString()
    }

    private fun buildSmsAccountDiscoveryResult(
      status: String,
      message: String? = null,
      accounts: JSONArray = JSONArray(),
      scannedCount: Int = 0,
      ignoredCount: Int = 0,
      hasMore: Boolean = false,
      nextCursor: String? = null
    ): String {
      val result = JSONObject()
        .put("status", status)
        .put("accounts", accounts)
        .put("discoveredCount", accounts.length())
        .put("scannedCount", scannedCount)
        .put("ignoredCount", ignoredCount)
        .put("hasMore", hasMore)

      if (!message.isNullOrBlank()) {
        result.put("message", message)
      }
      if (!nextCursor.isNullOrBlank() && hasMore) {
        result.put("nextCursor", nextCursor)
      }

      return result.toString()
    }
  }
}
