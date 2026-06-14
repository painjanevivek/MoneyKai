package com.moneykai.mobile

import android.app.Activity
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MoneyKaiProfileMediaModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private var pendingPromise: Promise? = null

  private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != PICK_AVATAR_REQUEST) {
        return
      }

      val promise = pendingPromise ?: return
      pendingPromise = null

      if (resultCode != Activity.RESULT_OK || data?.data == null) {
        promise.resolve(null)
        return
      }

      val uri = data.data ?: run {
        promise.resolve(null)
        return
      }

      val flags = data.flags and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
      runCatching {
        reactContext.contentResolver.takePersistableUriPermission(uri, flags and Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }

      promise.resolve(
        Arguments.createMap().apply {
          putString("uri", uri.toString())
          putString("name", getDisplayName(uri))
        }
      )
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = "MoneyKaiProfileMedia"

  @ReactMethod
  fun pickAvatarImage(promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "MoneyKai cannot open the picker right now.")
      return
    }

    if (pendingPromise != null) {
      promise.reject("PICKER_BUSY", "An avatar picker is already open.")
      return
    }

    pendingPromise = promise

    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "image/*"
      putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/jpeg", "image/png", "image/webp"))
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
    }

    try {
      activity.startActivityForResult(intent, PICK_AVATAR_REQUEST)
    } catch (error: Exception) {
      pendingPromise = null
      promise.reject("PICKER_UNAVAILABLE", error.message ?: "No image picker is available.")
    }
  }

  private fun getDisplayName(uri: Uri): String {
    var cursor: Cursor? = null
    return try {
      cursor = reactContext.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
      if (cursor != null && cursor.moveToFirst()) {
        val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (index >= 0) cursor.getString(index).orEmpty() else ""
      } else {
        ""
      }
    } catch (_: Exception) {
      ""
    } finally {
      cursor?.close()
    }
  }

  companion object {
    private const val PICK_AVATAR_REQUEST = 7102
  }
}
