plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val moneyKaiUploadStoreFile: String? = System.getenv("MONEYKAI_UPLOAD_STORE_FILE")
val moneyKaiUploadStorePassword: String? = System.getenv("MONEYKAI_UPLOAD_STORE_PASSWORD")
val moneyKaiUploadKeyAlias: String? = System.getenv("MONEYKAI_UPLOAD_KEY_ALIAS")
val moneyKaiUploadKeyPassword: String? = System.getenv("MONEYKAI_UPLOAD_KEY_PASSWORD")

android {
    namespace = "com.moneykai.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.moneykai.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (!moneyKaiUploadStoreFile.isNullOrBlank()) {
                storeFile = file(moneyKaiUploadStoreFile)
                storePassword = moneyKaiUploadStorePassword
                keyAlias = moneyKaiUploadKeyAlias
                keyPassword = moneyKaiUploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
