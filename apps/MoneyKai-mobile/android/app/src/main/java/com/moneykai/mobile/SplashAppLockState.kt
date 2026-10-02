package com.moneykai.mobile

import android.content.Context
import android.os.SystemClock

/** Native handoff for the splash prompt; never accepts an Intent extra as proof of authentication. */
object SplashAppLockState {
  private const val preferencesName = "moneykai-splash-app-lock"
  private const val enabledKey = "enabled"
  private var result = "none"
  private var verifiedAt = 0L

  fun isEnabled(context: Context): Boolean =
    context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE).getBoolean(enabledKey, false)

  fun setEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
      .edit().putBoolean(enabledKey, enabled).apply()
  }

  @Synchronized fun reset() {
    result = "none"
    verifiedAt = 0L
  }
  @Synchronized fun verified() {
    result = "verified"
    verifiedAt = SystemClock.elapsedRealtime()
  }
  @Synchronized fun cancelled() { result = "cancelled" }

  @Synchronized fun consumeResult(): String {
    val current = if (result == "verified" && SystemClock.elapsedRealtime() - verifiedAt > 60_000L) "none" else result
    reset()
    return current
  }
}
