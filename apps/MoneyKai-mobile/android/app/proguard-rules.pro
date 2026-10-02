# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
-keep class com.rt2zz.reactnativecontacts.** { *; }

# PDFBox's JPX image decoder is an optional dependency, not used by our
# text-only statement reader. Do not suppress other missing-class diagnostics.
# https://github.com/TomRoush/PdfBox-Android#reading-jpx-images
-dontwarn com.gemalto.jp2.JP2Decoder

# MainApplication.optionalPackage loads this package by class name at runtime.
# Preserve this exact reflection entry point (including its no-arg constructor).
-keep class com.moneykai.nativecapture.MoneyKaiNativeCapturePackage { *; }
