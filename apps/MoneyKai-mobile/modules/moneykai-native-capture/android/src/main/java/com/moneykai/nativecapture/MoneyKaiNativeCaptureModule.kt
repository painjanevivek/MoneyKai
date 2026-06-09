package com.moneykai.nativecapture

import android.content.ComponentName
import android.content.Context
import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class MoneyKaiNativeCaptureModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MoneyKaiNativeCapture")

    Events("onNotificationSignal")

    Function("startListening") {
      activeModule = this@MoneyKaiNativeCaptureModule
      flushPendingSignals(requireContext())
      true
    }

    Function("stopListening") {
      if (activeModule === this@MoneyKaiNativeCaptureModule) {
        activeModule = null
      }
      true
    }

    Function("getStatus") {
      activeModule = this@MoneyKaiNativeCaptureModule
      val status = Bundle()
      status.putString("platform", "android")
      status.putBoolean("nativeModuleAvailable", true)
      status.putString(
        "notificationAccess",
        if (isNotificationListenerEnabled(requireContext())) "granted" else "not_requested"
      )
      status.putString("smsAccess", "unsupported")
      status
    }

    Function("openNotificationListenerSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        requireContext().startActivity(intent)
        true
      } catch (_: ActivityNotFoundException) {
        false
      }
    }
  }

  private fun requireContext(): Context = requireNotNull(appContext.reactContext)

  companion object {
    private const val MAX_PENDING_SIGNALS = 50
    private const val PREFS_NAME = "moneykai_native_capture"
    private const val PREFS_PENDING_SIGNALS = "pending_notification_signals"

    private var activeModule: MoneyKaiNativeCaptureModule? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    fun handleNotificationSignal(context: Context, event: Bundle) {
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
  }
}
