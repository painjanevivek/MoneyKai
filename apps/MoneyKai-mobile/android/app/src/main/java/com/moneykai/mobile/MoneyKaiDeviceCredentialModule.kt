package com.moneykai.mobile

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MoneyKaiDeviceCredentialModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var pendingPromise: Promise? = null
  private val requestCode = 4862
  private val activityListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, code: Int, resultCode: Int, data: Intent?) {
      if (code != requestCode) return
      pendingPromise?.resolve(resultCode == Activity.RESULT_OK)
      pendingPromise = null
    }
  }

  init { reactContext.addActivityEventListener(activityListener) }

  override fun getName() = "MoneyKaiDeviceCredential"

  @ReactMethod
  fun setSplashAppLockEnabled(enabled: Boolean, promise: Promise) {
    SplashAppLockState.setEnabled(reactContext, enabled)
    promise.resolve(null)
  }

  @ReactMethod
  fun consumeSplashAppLockResult(promise: Promise) {
    promise.resolve(SplashAppLockState.consumeResult())
  }

  @ReactMethod
  fun isDeviceSecure(promise: Promise) {
    val keyguard = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    promise.resolve(keyguard.isDeviceSecure)
  }

  @Suppress("DEPRECATION")
  @ReactMethod
  fun confirmDeviceCredential(promise: Promise) {
    if (pendingPromise != null) {
      promise.reject("AUTH_IN_PROGRESS", "Device authentication is already open")
      return
    }
    val activity = reactContext.currentActivity
    val keyguard = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    if (activity == null || !keyguard.isDeviceSecure) {
      promise.resolve(false)
      return
    }
    val intent = keyguard.createConfirmDeviceCredentialIntent("Unlock MoneyKai", "Confirm your device screen lock")
    if (intent == null) {
      promise.resolve(false)
      return
    }
    pendingPromise = promise
    try {
      activity.startActivityForResult(intent, requestCode)
    } catch (error: Exception) {
      pendingPromise = null
      promise.reject("AUTH_UNAVAILABLE", error)
    }
  }
}
