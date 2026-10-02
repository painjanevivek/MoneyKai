package com.moneykai.mobile

import android.content.MutableContextWrapper
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/** Only the system/Google UI sees the account list. Never log or persist credentials. */
class MoneyKaiGoogleSignInModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context), LifecycleEventListener {
  private val handler = Handler(Looper.getMainLooper())
  private val manager = CredentialManager.create(context)
  private var pending: Promise? = null
  private var cancellation: CancellationSignal? = null
  private val timeout = Runnable {
    finishError("GOOGLE_SIGN_IN_TIMEOUT", "Google sign-in timed out. Please try again.")
  }

  init { context.addLifecycleEventListener(this) }
  override fun getName() = "MoneyKaiGoogleSignIn"

  @ReactMethod
  fun signIn(fallbackWebClientId: String, promise: Promise) {
    handler.post {
      if (pending != null) {
        promise.reject("GOOGLE_SIGN_IN_BUSY", "Google sign-in is already open.")
        return@post
      }
      val resourceId = context.resources.getIdentifier("default_web_client_id", "string", context.packageName)
      val clientId = if (resourceId != 0) context.getString(resourceId) else fallbackWebClientId.trim()
      if (!clientId.endsWith(".apps.googleusercontent.com")) {
        promise.reject("GOOGLE_SIGN_IN_CONFIGURATION", "Google sign-in is not configured for this build.")
        return@post
      }
      pending = promise
      cancellation = CancellationSignal()
      handler.postDelayed(timeout, 120_000)
      request(clientId, false)
    }
  }

  private fun request(clientId: String, buttonFlow: Boolean) {
    val signal = cancellation ?: return
    val activity = context.currentActivity
    if (activity == null || activity.isFinishing || activity.isDestroyed) {
      finishError("GOOGLE_SIGN_IN_UNAVAILABLE", "Open MoneyKai before signing in.")
      return
    }
    try {
      val option = if (buttonFlow) {
        GetSignInWithGoogleOption.Builder(clientId).build()
      } else {
        GetGoogleIdOption.Builder().setServerClientId(clientId)
          .setFilterByAuthorizedAccounts(false).setAutoSelectEnabled(false).build()
      }
      manager.getCredentialAsync(
        MutableContextWrapper(activity), GetCredentialRequest.Builder().addCredentialOption(option).build(),
        signal, ContextCompat.getMainExecutor(context),
        object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
          override fun onResult(result: GetCredentialResponse) {
            if (pending == null || cancellation !== signal) return
            try {
              val credential = result.credential
              if (credential !is CustomCredential ||
                  credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                finishError("GOOGLE_SIGN_IN_INVALID", "Google returned an unsupported credential.")
                return
              }
              val token = GoogleIdTokenCredential.createFrom(credential.data).idToken
              val promise = pending
              cleanup()
              promise?.resolve(token)
            } catch (_: Exception) {
              finishError("GOOGLE_SIGN_IN_INVALID", "Google did not return a valid credential. Please try again.")
            }
          }
          override fun onError(error: GetCredentialException) {
            if (pending == null || cancellation !== signal) return
            when {
              error is GetCredentialCancellationException ->
                finishError("GOOGLE_SIGN_IN_CANCELLED", "Google sign-in cancelled.")
              error is NoCredentialException && !buttonFlow -> request(clientId, true)
              else -> finishError("GOOGLE_SIGN_IN_FAILED",
                "Google sign-in could not finish. Check Google Play services and try again, or use email login.")
            }
          }
        }
      )
    } catch (_: Exception) {
      finishError("GOOGLE_SIGN_IN_FAILED", "Google sign-in could not open. Please use email login.")
    }
  }

  private fun cleanup() {
    pending = null
    handler.removeCallbacks(timeout)
    val signal = cancellation
    cancellation = null
    signal?.cancel()
  }

  private fun finishError(code: String, message: String) {
    val promise = pending
    cleanup()
    promise?.reject(code, message)
  }

  @ReactMethod
  fun clearSession(promise: Promise) {
    manager.clearCredentialStateAsync(ClearCredentialStateRequest(), null,
      ContextCompat.getMainExecutor(context), object : CredentialManagerCallback<Void?, ClearCredentialException> {
        override fun onResult(result: Void?) { promise.resolve(null) }
        override fun onError(error: ClearCredentialException) { promise.resolve(null) }
      })
  }

  override fun onHostResume() = Unit
  override fun onHostPause() = Unit // The account chooser itself pauses the activity.
  override fun onHostDestroy() {
    handler.post { finishError("GOOGLE_SIGN_IN_CANCELLED", "Google sign-in cancelled.") }
  }
  override fun invalidate() {
    context.removeLifecycleEventListener(this)
    handler.post { finishError("GOOGLE_SIGN_IN_CANCELLED", "Google sign-in cancelled.") }
    super.invalidate()
  }
}
