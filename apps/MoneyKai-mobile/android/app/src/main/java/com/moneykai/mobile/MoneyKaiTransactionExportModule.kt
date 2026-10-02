package com.moneykai.mobile

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import java.util.concurrent.Executors

/** Only writes a newly-created document explicitly selected by the owner. */
class MoneyKaiTransactionExportModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var pending: Promise? = null
  private var content: String? = null
  private val writer = Executors.newSingleThreadExecutor()
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != 7104) return
      val promise = pending ?: return
      val csv = content
      pending = null
      content = null
      val uri = data?.data
      if (resultCode != Activity.RESULT_OK || uri == null || csv == null) { promise.resolve(false); return }
      writer.execute {
        try {
          val stream = context.contentResolver.openOutputStream(uri, "w") ?: throw IllegalStateException()
          stream.use { it.write(csv.toByteArray(Charsets.UTF_8)) }
          promise.resolve(true)
        } catch (_: Exception) { promise.reject("EXPORT_WRITE_FAILED", "Could not write the CSV. The chosen file may be incomplete; delete it or retry.") }
      }
    }
  }
  init { context.addActivityEventListener(listener); context.addLifecycleEventListener(this) }
  override fun onHostResume() = Unit
  override fun onHostPause() = Unit
  override fun onHostDestroy() {
    pending?.reject("EXPORT_CANCELLED", "Export was cancelled.")
    pending = null
    content = null
  }
  override fun getName() = "MoneyKaiTransactionExport"
  @ReactMethod fun saveCsv(name: String, csv: String, promise: Promise) {
    if (csv.length > 8_000_000) { promise.reject("EXPORT_TOO_LARGE", "Choose a smaller date range."); return }
    context.runOnUiQueueThread {
      val activity = context.currentActivity
      if (activity == null) { promise.reject("NO_ACTIVITY", "Reopen Download and try again."); return@runOnUiQueueThread }
      if (pending != null) { promise.reject("EXPORT_BUSY", "A save dialog is already open."); return@runOnUiQueueThread }
      pending = promise
      content = csv
      try {
        activity.startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
          addCategory(Intent.CATEGORY_OPENABLE)
          type = "text/csv"
          putExtra(Intent.EXTRA_TITLE, name.replace(Regex("[^A-Za-z0-9._-]"), "_").take(100))
        }, 7104)
      } catch (_: Exception) { pending = null; content = null; promise.reject("EXPORT_UNAVAILABLE", "No file picker is available.") }
    }
  }
  override fun invalidate() {
    context.removeActivityEventListener(listener)
    context.removeLifecycleEventListener(this)
    pending?.reject("EXPORT_CANCELLED", "Export was cancelled.")
    pending = null
    content = null
    writer.shutdown()
    super.invalidate()
  }
}
