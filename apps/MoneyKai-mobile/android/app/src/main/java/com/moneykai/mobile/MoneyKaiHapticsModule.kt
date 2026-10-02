package com.moneykai.mobile

import android.os.Build
import android.view.HapticFeedbackConstants
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/** Foreground touch feedback. No flags bypass Android's user settings. */
class MoneyKaiHapticsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "MoneyKaiHaptics"

  @ReactMethod
  fun perform(kind: String, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val activity = context.currentActivity
        val view = activity?.window?.decorView
        if (activity == null || activity.isFinishing || view == null || !view.hasWindowFocus()) {
          promise.resolve(false)
          return@runOnUiThread
        }
        val effect = if (kind == "confirm" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          HapticFeedbackConstants.CONFIRM
        } else {
          HapticFeedbackConstants.KEYBOARD_TAP
        }
        promise.resolve(view.performHapticFeedback(effect))
      } catch (_: Exception) {
        promise.resolve(false)
      }
    }
  }
}
