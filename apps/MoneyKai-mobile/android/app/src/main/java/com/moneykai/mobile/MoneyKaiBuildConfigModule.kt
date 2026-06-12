package com.moneykai.mobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class MoneyKaiBuildConfigModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "MoneyKaiBuildConfig"

  override fun getConstants(): MutableMap<String, Any> =
    hashMapOf(
      "smsResearchBuild" to BuildConfig.MONEYKAI_SMS_RESEARCH_BUILD,
      "nativeSmsResearchBuild" to BuildConfig.MONEYKAI_NATIVE_SMS_RESEARCH_BUILD
    )
}
