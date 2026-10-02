package com.moneykai.nativecapture

import android.Manifest
import android.app.job.JobInfo
import android.app.job.JobScheduler
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.UUID

/** No message content is stored here. Scheduling metadata is device-encrypted. */
object MoneyKaiSmsSchedule {
  const val JOB_ID = 21408
  private const val KEY = "moneykai-sms-schedule"
  private const val CONSENT_VERSION = "2026-09-30-v2"
  private val intervals = setOf(15, 30, 60, 120, 720, 1440)
  fun validInterval(minutes: Int) = intervals.contains(minutes)

  @Synchronized fun configure(context: Context, enabled: Boolean, minutes: Int, owner: String): Boolean {
    val scheduler = context.getSystemService(JobScheduler::class.java)
    if (!enabled) { scheduler.cancel(JOB_ID); MoneyKaiPrivateStorage.remove(context, KEY); return true }
    if (!validInterval(minutes) || owner.isBlank() || !supported(context)) return false
    if (context.checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) return false
    val old = read(context)
    val configuration = if (old != null && old.optString("owner") == owner) old else JSONObject()
      .put("owner", owner).put("generation", UUID.randomUUID().toString()).put("cursorDate", System.currentTimeMillis()).put("cursorId", -1L)
    configuration.put("minutes", minutes)
    MoneyKaiPrivateStorage.set(context, KEY, configuration.toString())
    val intervalMillis = TimeUnit.MINUTES.toMillis(minutes.toLong())
    if (scheduler.getPendingJob(JOB_ID)?.intervalMillis == intervalMillis) return true
    val job = JobInfo.Builder(JOB_ID, ComponentName(context, MoneyKaiSmsJobService::class.java))
      .setPeriodic(intervalMillis).setPersisted(true).setRequiresBatteryNotLow(true).build()
    if (scheduler.schedule(job) == JobScheduler.RESULT_SUCCESS) return true
    MoneyKaiPrivateStorage.remove(context, KEY)
    return false
  }
  fun supported(context: Context): Boolean = try {
    context.packageManager.getServiceInfo(ComponentName(context, MoneyKaiSmsJobService::class.java), 0)
    true
  } catch (_: Exception) { false }
  @Synchronized fun read(context: Context): JSONObject? = MoneyKaiPrivateStorage.get(context, KEY)?.let { JSONObject(it) }
  fun isScheduled(context: Context): Boolean = read(context) != null

  /** Re-check consent, owner, switches and OS permission before reading any inbox. */
  fun allowed(context: Context, configuration: JSONObject): Boolean {
    if (!MoneyKaiNativeCaptureModule.isCaptureEnabled(context) || !MoneyKaiNativeCaptureModule.isSmsCaptureEnabled(context)) return false
    if (!supported(context) || context.checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) return false
    val current = read(context) ?: return false
    if (current.optString("owner") != configuration.optString("owner") || current.optString("generation") != configuration.optString("generation")) return false
    val capture = MoneyKaiPrivateStorage.get(context, "moneykai-auto-capture") ?: return false
    val settings = JSONObject(capture).optJSONObject("state")?.optJSONObject("settings") ?: return false
    return settings.optBoolean("autoCaptureEnabled") && settings.optBoolean("smsResearchModeEnabled") &&
      settings.optString("smsConsentUserId") == current.optString("owner") &&
      settings.optString("smsConsentVersion") == CONSENT_VERSION &&
      settings.optString("smsResearchExplainerAcceptedAt").isNotBlank()
  }
  @Synchronized fun advance(context: Context, owner: String, generation: String, date: Long, id: Long) {
    val current = read(context) ?: return
    if (current.optString("owner") != owner || current.optString("generation") != generation) return
    val previousDate = current.optLong("cursorDate")
    if (date < previousDate || (date == previousDate && id < current.optLong("cursorId"))) return
    current.put("cursorDate", date).put("cursorId", id).put("lastCheckedAt", System.currentTimeMillis())
    MoneyKaiPrivateStorage.set(context, KEY, current.toString())
  }
}
