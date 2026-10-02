package com.moneykai.mobile

import android.app.Activity
import android.app.KeyguardManager
import android.content.Intent
import android.graphics.Color
import android.hardware.biometrics.BiometricManager
import android.hardware.biometrics.BiometricPrompt
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import android.widget.VideoView
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

/** Shows the supplied brand film between Android's static launch screen and React Native. */
class SplashVideoActivity : Activity() {
  private val handler = Handler(Looper.getMainLooper())
  private val timeout = Runnable { finishIntro() }
  private var videoView: VideoView? = null
  private var skipView: TextView? = null
  private var appOpened = false
  private var introFinished = false
  private var lockRequired = false
  private var authStarted = false
  private var authPending = false
  private var authVerified = false
  private var authCancellation: CancellationSignal? = null
  private val credentialRequestCode = 4863

  override fun onCreate(savedInstanceState: Bundle?) {
    installSplashScreen()
    super.onCreate(savedInstanceState)

    // Returning to an already-running task should not replay the introduction.
    if (!isTaskRoot) {
      openApp()
      return
    }
    SplashAppLockState.reset()
    lockRequired = SplashAppLockState.isEnabled(this)

    window.decorView.systemUiVisibility = (
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
        View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
        View.SYSTEM_UI_FLAG_FULLSCREEN or
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      )

    val background = Color.rgb(16, 19, 14)
    val root = FrameLayout(this).apply { setBackgroundColor(background) }
    val video = VideoView(this).apply {
      setBackgroundColor(background)
      setOnPreparedListener { player ->
        player.isLooping = false
        player.setVolume(0f, 0f)
        setBackgroundColor(Color.TRANSPARENT)
        start()
      }
      setOnCompletionListener { finishIntro() }
      setOnErrorListener { _, _, _ ->
        finishIntro()
        true
      }
    }
    videoView = video
    root.addView(video, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

    val skip = TextView(this).apply {
      setText(R.string.skip_intro)
      setTextColor(Color.rgb(243, 247, 244))
      textSize = 14f
      contentDescription = getString(R.string.skip_intro_accessibility)
      isClickable = true
      isFocusable = true
      setPadding(dp(16), dp(12), dp(16), dp(12))
      setOnClickListener {
        finishIntro()
        if (lockRequired && !authPending && !authVerified) startSplashAuthentication()
      }
    }
    skipView = skip
    root.addView(skip, FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.END).apply {
      topMargin = dp(24)
      marginEnd = dp(16)
    })

    setContentView(root)
    // The optional brand film may be absent in an isolated checkout. Authentication still runs.
    val film = resources.getIdentifier("moneykai_splash", "raw", packageName)
    if(film != 0) video.setVideoURI(Uri.parse("android.resource://$packageName/$film")) else finishIntro()
  }

  override fun onStart() {
    super.onStart()
    if (!appOpened && !introFinished) {
      videoView?.start()
      handler.postDelayed(timeout, 6_500)
    }
  }

  override fun onResume() {
    super.onResume()
    if (!appOpened && isTaskRoot && lockRequired && !authStarted) {
      authStarted = true
      handler.post { if (!isFinishing) startSplashAuthentication() }
    }
  }

  @Suppress("DEPRECATION")
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode != credentialRequestCode) return
    if (resultCode == RESULT_OK) authenticationSucceeded() else authenticationStopped()
  }

  override fun onStop() {
    handler.removeCallbacks(timeout)
    videoView?.pause()
    super.onStop()
  }

  override fun onDestroy() {
    handler.removeCallbacks(timeout)
    authCancellation?.cancel()
    videoView?.stopPlayback()
    videoView = null
    skipView = null
    super.onDestroy()
  }

  @Deprecated("Handled for the splash handoff on older Android versions")
  override fun onBackPressed() {
    finishIntro()
  }

  private fun finishIntro() {
    introFinished = true
    handler.removeCallbacks(timeout)
    if (!lockRequired || authVerified) openApp()
  }

  private fun authenticationSucceeded() {
    authPending = false
    authVerified = true
    SplashAppLockState.verified()
    if (introFinished) openApp()
  }

  private fun authenticationStopped() {
    authPending = false
    skipView?.text = "Unlock"
    // Stay on the splash. A cancelled or failed prompt never opens account content.
  }

  @Suppress("DEPRECATION")
  private fun startSplashAuthentication() {
    if (!lockRequired || authPending || authVerified || isFinishing) return
    val keyguard = getSystemService(KEYGUARD_SERVICE) as KeyguardManager
    if (!keyguard.isDeviceSecure) {
      skipView?.text = "Device lock required"
      return
    }

    authPending = true
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val signal = CancellationSignal()
        authCancellation = signal
        BiometricPrompt.Builder(this)
          .setTitle("Unlock MoneyKai")
          .setSubtitle("Verify to open your account")
          .setAllowedAuthenticators(
            BiometricManager.Authenticators.BIOMETRIC_WEAK or
              BiometricManager.Authenticators.DEVICE_CREDENTIAL
          )
          .build()
          .authenticate(signal, mainExecutor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
              authenticationSucceeded()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              authenticationStopped()
            }
          })
      } else {
        val intent = keyguard.createConfirmDeviceCredentialIntent(
          "Unlock MoneyKai", "Confirm your device screen lock")
        if (intent == null) {
          authenticationStopped()
          return
        }
        startActivityForResult(intent, credentialRequestCode)
      }
    } catch (_: Exception) {
      authenticationStopped()
    }
  }

  private fun openApp() {
    if (appOpened || isFinishing) return
    appOpened = true
    handler.removeCallbacks(timeout)
    val launchIntent = intent
    startActivity(Intent(this, MainActivity::class.java).apply {
      action = launchIntent?.action
      data = launchIntent?.data
      launchIntent?.extras?.let { putExtras(it) }
      addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
    })
    finish()
    overridePendingTransition(0, 0)
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density + 0.5f).toInt()
}
