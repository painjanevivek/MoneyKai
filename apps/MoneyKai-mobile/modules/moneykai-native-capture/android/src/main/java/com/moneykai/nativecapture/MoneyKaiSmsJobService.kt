package com.moneykai.nativecapture

import android.app.job.JobParameters
import android.app.job.JobService
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import java.util.concurrent.Executors
import java.util.concurrent.Future

/** Local, bounded background scan. It queues drafts, never financial entries. */
class MoneyKaiSmsJobService : JobService() {
  private val executor = Executors.newSingleThreadExecutor()
  private var running: Future<*>? = null
  override fun onStartJob(params: JobParameters): Boolean {
    running = executor.submit {
      var retry = false
      try { retry = scan() } catch (_: Exception) { retry = true } // Never log SMS or provider errors.
      if (!Thread.currentThread().isInterrupted) Handler(Looper.getMainLooper()).post { jobFinished(params, retry) }
    }
    return true
  }
  override fun onStopJob(params: JobParameters): Boolean { running?.cancel(true); return true }
  override fun onDestroy() { executor.shutdownNow(); super.onDestroy() }

  private fun scan(): Boolean {
    val config = MoneyKaiSmsSchedule.read(this) ?: return false
    if (!MoneyKaiSmsSchedule.allowed(this, config)) {
      MoneyKaiSmsSchedule.configure(this, false, 60, "")
      return false
    }
    val owner = config.getString("owner")
    val afterDate = config.getLong("cursorDate")
    val afterId = config.getLong("cursorId")
    contentResolver.query(Uri.parse("content://sms/inbox"), arrayOf("_id", "address", "body", "date"),
      "(date > ? OR (date = ? AND _id > ?))", arrayOf(afterDate.toString(), afterDate.toString(), afterId.toString()), "date ASC, _id ASC")?.use { cursor ->
      var scanned = 0
      while (scanned < 250 && !Thread.currentThread().isInterrupted && cursor.moveToNext()) {
        if (!MoneyKaiSmsSchedule.allowed(this, config)) return false
        scanned++
        val id = cursor.getLong(0)
        val sender = cursor.getString(1).orEmpty()
        val body = cursor.getString(2).orEmpty()
        val date = cursor.getLong(3)
        if (MoneyKaiSmsFilters.shouldImportSms(sender, body)) {
          val account = MoneyKaiSmsFilters.buildAccountId(sender, body)
          val approved = MoneyKaiNativeCaptureModule.isSmsAccountApproved(this, account)
          val event = Bundle().apply {
            putString("source", "sms"); putString("sender", MoneyKaiSmsFilters.sanitizeSmsText(sender))
            putString("body", if (approved) MoneyKaiSmsFilters.sanitizeSmsText(body) else "Bank account approval preview")
              putString("smsAutoRecordSafe", (approved && MoneyKaiSmsAutoRecord.safe(body)).toString())
              if (approved) MoneyKaiSmsAutoRecord.referenceHash(body)?.let { putString("smsReferenceHash", it) }
            putString("receivedAt", MoneyKaiSmsFilters.toIsoUtc(date))
            putString("captureOrigin", if (approved) "android_sms_scheduled_scan" else "android_sms_account_discovery")
            putString("rawBodyStored", "false"); putString("smsMessageId", id.toString()); putString("smsOwnerId", owner)
            MoneyKaiSmsFilters.extractAccountHint(body)?.let { putString("smsAccountHint", it) }
          }
          if (!MoneyKaiNativeCaptureModule.queueScheduledSignal(this, event)) return true
        }
        MoneyKaiSmsSchedule.advance(this, owner, config.getString("generation"), date, id)
      }
      return scanned >= 250
    }
    return false
  }
}
