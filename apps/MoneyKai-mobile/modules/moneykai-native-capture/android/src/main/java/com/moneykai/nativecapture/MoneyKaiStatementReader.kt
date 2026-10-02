package com.moneykai.nativecapture

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.encryption.InvalidPasswordException
import com.tom_roush.pdfbox.text.PDFTextStripper
import java.util.concurrent.Executors

/** Reads only a user-selected PDF on-device, without uploading or retaining it. */
class MoneyKaiStatementReader(private val context: ReactApplicationContext) {
  private val executor = Executors.newSingleThreadExecutor()
  @Volatile private var pending: Promise? = null
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CODE) return
      val promise = pending ?: return
      val uri = data?.data
      if (resultCode != Activity.RESULT_OK || uri == null) {
        pending = null
        promise.resolve(null)
        return
      }
      executor.execute {
        try {
          val bytes = context.contentResolver.openInputStream(uri)?.use { stream ->
            val output = java.io.ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            var count = stream.read(buffer)
            while (count != -1) {
              require(output.size() + count <= MAX_BYTES) { "Choose a PDF smaller than 10 MB." }
              output.write(buffer, 0, count)
              count = stream.read(buffer)
            }
            output.toByteArray()
          } ?: throw IllegalArgumentException("Could not open this file. Save it on your device and try again.")
          require(bytes.take(5).toByteArray().toString(Charsets.US_ASCII) == "%PDF-") { "Choose a PDF statement exported by your payment app." }
          PDFBoxResourceLoader.init(context)
          val text = PDDocument.load(bytes).use { document ->
            require(document.numberOfPages <= 100) { "Choose a statement with at most 100 pages." }
            require(document.currentAccessPermission.canExtractContent()) { "This PDF does not allow text extraction." }
            PDFTextStripper().apply { sortByPosition = true }.getText(document)
          }
          require(text.length <= 1_000_000) { "Choose a shorter statement period." }
          require(text.isNotBlank()) { "This PDF has no readable text. Export the original statement rather than a scan." }
          promise.resolve(Arguments.createMap().apply {
            putString("name", displayName(uri))
            putString("text", text)
          })
        } catch (_: InvalidPasswordException) {
          promise.reject("STATEMENT_LOCKED", "This PDF is password protected. Export an unlocked payment-app statement.")
        } catch (error: IllegalArgumentException) {
          promise.reject("STATEMENT_UNSUPPORTED", error.message)
        } catch (_: Exception) {
          promise.reject("STATEMENT_READ_FAILED", "Could not read this PDF. Export it again from your payment app and retry.")
        } finally {
          pending = null
        }
      }
    }
  }

  init { context.addActivityEventListener(listener) }

  fun pick(promise: Promise) {
    val activity = context.currentActivity
    if (activity == null) { promise.reject("NO_ACTIVITY", "Cannot open the file picker right now."); return }
    if (pending != null) { promise.reject("PICKER_BUSY", "A statement is already being opened."); return }
    pending = promise
    try {
      activity.startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "application/pdf"
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }, REQUEST_CODE)
    } catch (_: Exception) {
      pending = null
      promise.reject("PICKER_UNAVAILABLE", "Cannot open the file picker on this device.")
    }
  }

  private fun displayName(uri: Uri): String = runCatching {
    context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) cursor.getString(0) else null
    }
  }.getOrNull() ?: "Payment statement.pdf"

  fun close() {
    context.removeActivityEventListener(listener)
    pending?.reject("STATEMENT_CANCELLED", "Statement reading was interrupted. Please retry.")
    pending = null
    executor.shutdownNow()
  }

  companion object {
    private const val REQUEST_CODE = 7103
    private const val MAX_BYTES = 10 * 1024 * 1024
  }
}
