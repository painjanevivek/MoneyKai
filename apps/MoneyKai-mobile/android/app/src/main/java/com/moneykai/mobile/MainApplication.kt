package com.moneykai.mobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactPackage
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          optionalPackage("com.moneykai.nativecapture.MoneyKaiNativeCapturePackage")?.let(::add)
          add(MoneyKaiProfileMediaPackage())
          add(MoneyKaiBuildConfigPackage())
          add(MoneyKaiDeviceCredentialPackage())
          add(MoneyKaiGoogleSignInPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
  }

  private fun optionalPackage(className: String): ReactPackage? =
    try {
      Class.forName(className).getDeclaredConstructor().newInstance() as? ReactPackage
    } catch (_: ReflectiveOperationException) {
      null
    }
}
