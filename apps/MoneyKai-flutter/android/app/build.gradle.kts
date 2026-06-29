plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val moneyKaiUploadStoreFile: String? = System.getenv("MONEYKAI_UPLOAD_STORE_FILE")
val moneyKaiUploadStorePassword: String? = System.getenv("MONEYKAI_UPLOAD_STORE_PASSWORD")
val moneyKaiUploadKeyAlias: String? = System.getenv("MONEYKAI_UPLOAD_KEY_ALIAS")
val moneyKaiUploadKeyPassword: String? = System.getenv("MONEYKAI_UPLOAD_KEY_PASSWORD")
val moneyKaiUploadSigningValues = listOf(
    moneyKaiUploadStoreFile,
    moneyKaiUploadStorePassword,
    moneyKaiUploadKeyAlias,
    moneyKaiUploadKeyPassword,
)
val hasAnyMoneyKaiUploadSigningConfig = moneyKaiUploadSigningValues.any { !it.isNullOrBlank() }
val hasMoneyKaiUploadSigningConfig = moneyKaiUploadSigningValues.all { !it.isNullOrBlank() }

if (hasAnyMoneyKaiUploadSigningConfig && !hasMoneyKaiUploadSigningConfig) {
    throw GradleException(
        "MoneyKai release signing requires all MONEYKAI_UPLOAD_* environment variables: " +
            "MONEYKAI_UPLOAD_STORE_FILE, MONEYKAI_UPLOAD_STORE_PASSWORD, " +
            "MONEYKAI_UPLOAD_KEY_ALIAS, MONEYKAI_UPLOAD_KEY_PASSWORD."
    )
}

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
            if (hasMoneyKaiUploadSigningConfig) {
                storeFile = file(moneyKaiUploadStoreFile!!)
                storePassword = moneyKaiUploadStorePassword
                keyAlias = moneyKaiUploadKeyAlias
                keyPassword = moneyKaiUploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            if (hasMoneyKaiUploadSigningConfig) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                signingConfig = null
            }
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
