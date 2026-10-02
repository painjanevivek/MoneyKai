package com.moneykai.nativecapture

import android.Manifest
import android.app.job.JobInfo
import android.app.job.JobScheduler
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import org.json.JSONArray
import org.json.JSONObject
import net.zetetic.database.sqlcipher.SQLiteDatabase
import java.util.UUID

/** Durable inbox jobs. Raw rows never leave this worker or enter the encrypted ledger. */
internal object MoneyKaiLocalImport {
  const val HISTORY_JOB_ID = 21409
  const val BATCH_SIZE = 250
  private const val ENABLED = "moneykai-large-sms-enabled"
  fun enabled(context: Context) = MoneyKaiPrivateStorage.get(context,ENABLED) == "true"
  fun configure(context: Context, enabled: Boolean) { MoneyKaiPrivateStorage.set(context,ENABLED,enabled.toString()) }
  fun schedule(context: Context) {
    if(!enabled(context) || !MoneyKaiSmsSchedule.supported(context)) return
    context.getSystemService(JobScheduler::class.java).schedule(JobInfo.Builder(HISTORY_JOB_ID,ComponentName(context,MoneyKaiSmsJobService::class.java))
      .setMinimumLatency(1000).setRequiresBatteryNotLow(true).setPersisted(true).build())
  }
  fun allowed(context: Context, owner: String): Boolean {
    if(!enabled(context) || MoneyKaiLedger.activeOwner(context) != owner || context.checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) return false
    if(!MoneyKaiNativeCaptureModule.isSmsCaptureEnabled(context)) return false
    val settings = MoneyKaiPrivateStorage.get(context,"moneykai-auto-capture")?.let { JSONObject(it).optJSONObject("state")?.optJSONObject("settings") } ?: return false
    return settings.optBoolean("autoCaptureEnabled") && settings.optBoolean("smsResearchModeEnabled") &&
      settings.optString("smsConsentUserId") == owner && settings.optString("smsConsentVersion") == "2026-09-30-v2" && settings.optString("smsResearchExplainerAcceptedAt").isNotBlank()
  }
  fun save(db: SQLiteDatabase, owner: String, job: JSONObject) {
    db.execSQL("INSERT INTO import_jobs VALUES(?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET state=excluded.state,payload=excluded.payload",arrayOf(owner,job.getString("id"),job.getString("state"),job.toString()))
  }
  fun get(db: SQLiteDatabase, owner: String, id: String): JSONObject = db.rawQuery("SELECT payload FROM import_jobs WHERE owner=? AND id=?",arrayOf(owner,id)).use {
    check(it.moveToFirst()) { "Import not found" }; JSONObject(it.getString(0))
  }
  fun active(db: SQLiteDatabase, owner: String): JSONObject? = db.rawQuery("SELECT payload FROM import_jobs WHERE owner=? AND state IN ('discovering','importing','awaiting_account_approval','paused','failed') LIMIT 1",arrayOf(owner)).use {
    if(it.moveToFirst()) JSONObject(it.getString(0)) else null
  }
  fun newJob(owner: String, from: Long, boundaryDate: Long, boundaryId: Long, incremental: Boolean = false): JSONObject = JSONObject()
    .put("id",UUID.randomUUID().toString()).put("owner",owner).put("state",if(incremental) "importing" else "discovering")
    .put("parserVersion","sms-offline-v1").put("fromDate",from).put("boundaryDate",boundaryDate).put("boundaryId",boundaryId)
    .put("cursorDate",boundaryDate).put("cursorId",boundaryId+1).put("kind",if(incremental) "incremental" else "history")
    .put("selectedAccounts",JSONArray()).put("progress",JSONObject().put("scanned",0).put("parsed",0).put("duplicates",0).put("review",0).put("awaitingSync",0).put("synced",0))
    .put("ignored",0).put("batches",0)
  private fun boundary(context: Context): Pair<Long,Long> {
    val date = System.currentTimeMillis()
    val args = Bundle().apply { putString(android.content.ContentResolver.QUERY_ARG_SQL_SORT_ORDER,"_id DESC"); putInt(android.content.ContentResolver.QUERY_ARG_LIMIT,1) }
    val id = context.contentResolver.query(Uri.parse("content://sms/inbox"),arrayOf("_id"),args,null)?.use { if(it.moveToFirst()) it.getLong(0) else -1L } ?: -1L
    return date to id
  }
  fun readRows(context: Context, job: JSONObject): JSONArray {
    val clauses = mutableListOf("date>=?","date<=?","_id<=?","(date<? OR (date=? AND _id<?))")
    val values = mutableListOf(job.getLong("fromDate").toString(),job.getLong("boundaryDate").toString(),job.getLong("boundaryId").toString(),job.getLong("cursorDate").toString(),job.getLong("cursorDate").toString(),job.getLong("cursorId").toString())
    job.optJSONObject("after")?.let { clauses.add("(date>? OR (date=? AND _id>?))"); values.add(it.getLong("date").toString()); values.add(it.getLong("date").toString()); values.add(it.getLong("id").toString()) }
    val args = Bundle().apply { putString(android.content.ContentResolver.QUERY_ARG_SQL_SELECTION,clauses.joinToString(" AND ")); putStringArray(android.content.ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS,values.toTypedArray()); putString(android.content.ContentResolver.QUERY_ARG_SQL_SORT_ORDER,"date DESC,_id DESC"); putInt(android.content.ContentResolver.QUERY_ARG_LIMIT,BATCH_SIZE) }
    val rows = JSONArray()
    context.contentResolver.query(Uri.parse("content://sms/inbox"),arrayOf("_id","address","body","date"),args,null)?.use {
      while(rows.length() < BATCH_SIZE && it.moveToNext()) rows.put(JSONObject().put("id",it.getLong(0).toString()).put("sender",it.getString(1).orEmpty()).put("body",it.getString(2).orEmpty()).put("date",it.getLong(3)))
    } ?: error("SMS provider unavailable")
    return rows
  }
  private fun increment(progress: JSONObject, key: String) { progress.put(key,progress.optLong(key)+1) }
  /** Accepts at most 250 temporary rows; results, summaries and cursor commit together. */
  fun processRows(context: Context, db: SQLiteDatabase, owner: String, jobInput: JSONObject, rows: JSONArray, canContinue: () -> Boolean): JSONObject {
    require(rows.length() <= BATCH_SIZE)
    val job = JSONObject(jobInput.toString())
    val progress = job.getJSONObject("progress")
    val discovering = job.getString("state") == "discovering"
    require(job.getString("state") in listOf("discovering","importing"))
    val selected = job.getJSONArray("selectedAccounts").let { (0 until it.length()).map { index -> it.getString(index) }.toSet() }
    val capture = MoneyKaiPrivateStorage.get(context,"moneykai-auto-capture")?.let { JSONObject(it).optJSONObject("state") }
    val settings = capture?.optJSONObject("settings")
    val rules = capture?.optJSONArray("merchantRules") ?: JSONArray()
    db.beginTransaction()
    try {
      check(canContinue())
      for(index in 0 until rows.length()) {
        check(!Thread.currentThread().isInterrupted) { "Import interrupted" }
        val raw = rows.getJSONObject(index)
        val sender = raw.getString("sender"); val body = raw.getString("body"); val date = raw.getLong("date"); val inboxId = raw.getString("id")
        increment(progress,"scanned")
        val account = MoneyKaiSmsFilters.buildAccountId(sender,body)
        if(discovering) {
          if(account != null && MoneyKaiSmsFilters.shouldImportSms(sender,body)) {
            val metadata = JSONObject().put("id",account).put("source","sms").put("bankKey",account.split(':')[1]).put("bankLabel",sender.take(80)).put("accountHint",MoneyKaiSmsFilters.extractAccountHint(body) ?: JSONObject.NULL)
              .put("status","pending").put("sampleCount",1).put("firstSeenAt",MoneyKaiSmsFilters.toIsoUtc(date)).put("lastSeenAt",MoneyKaiSmsFilters.toIsoUtc(date))
            db.execSQL("INSERT OR IGNORE INTO discovered_accounts VALUES(?,?,?,?)",arrayOf(owner,job.getString("id"),account,metadata.toString()))
          }
        } else if(account != null && account in selected) {
          val message = MoneyKaiOfflineSmsParser.messageIdentity(sender,body,date,inboxId)
          val previous = db.rawQuery("SELECT outcome,record_id FROM processed_messages WHERE owner=? AND identity=?",arrayOf(owner,message)).use { if(it.moveToFirst()) it.getString(0) to it.getString(1) else null }
          if(previous != null) {
            if(previous.second != null) { increment(progress,"duplicates"); increment(progress,"parsed") } else increment(job,"ignored")
          } else {
            val parsed = MoneyKaiOfflineSmsParser.parse(context,sender,body,date,inboxId)
            var outcome = "ignored"; var recordId: String? = null
            if(parsed != null) {
              increment(progress,"parsed")
              recordId = parsed.getString("id")
              val identity = parsed.getString("importIdentity")
              val duplicate = MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM (SELECT id FROM transactions WHERE owner=? AND identity=? UNION ALL SELECT id FROM drafts WHERE owner=? AND identity=?)",arrayOf(owner,identity,owner,identity)) > 0L
              if(duplicate) { increment(progress,"duplicates"); outcome = "duplicate" }
              else {
                parsed.put("user_id",owner).put("importJobId",job.getString("id"))
                val similarities = JSONArray()
                if(!parsed.getBoolean("strongIdentity")) db.rawQuery("SELECT id FROM transactions WHERE owner=? AND day=? AND amount_minor=? AND direction=? AND account=? AND merchant=? LIMIT 5",arrayOf(owner,parsed.getString("transaction_date"),parsed.getLong("amountMinor").toString(),parsed.getString("type"),parsed.getString("accountIdentity"),parsed.getString("description").lowercase())).use { while(it.moveToNext()) similarities.put(it.getString(0)) }
                parsed.put("possibleDuplicateIds",similarities)
                // Explicit auto-add is preserved only for exact owner-confirmed categories.
                var learned: String? = null
                val classified = MoneyKaiOfflineCategoryModel.classify(context,parsed.getString("description"))
                for(ruleIndex in 0 until rules.length()) {
                  val rule = rules.getJSONObject(ruleIndex)
                  if(rule.optString("userId") == owner && rule.optString("source") == "manual" && rule.optString("transactionType") == parsed.getString("type") && rule.optString("merchantLabel").equals(parsed.getString("description"),true)) { learned = rule.optString("category"); break }
                }
                val category = learned ?: classified.first
                val autoAdd = settings?.optBoolean("autoAddRecognizedSms") == true && settings.optString("smsAutoAddConsentUserId") == owner && settings.optString("smsAutoAddConsentVersion") == "2026-09-30-auto-add-v1" && settings.optString("smsAutoAddConsentAcceptedAt").isNotBlank() && category != null && (learned != null || classified.second) && parsed.getString("type") == "expense" && parsed.getString("semantics") == "payment" && parsed.getBoolean("strongIdentity") && !parsed.getBoolean("ambiguous") && similarities.length() == 0 && MoneyKaiSmsAutoRecord.safe(body)
                if(autoAdd) {
                  parsed.put("category",category).put("status","confirmed").put("reviewStatus","approved").put("reviewRequired",false).put("automaticallyRecorded",true)
                  MoneyKaiLedger.put(db,owner,"transactions",parsed); outcome = "approved"
                } else { MoneyKaiLedger.put(db,owner,"drafts",parsed); increment(progress,"review"); outcome = "drafted" }
              }
            } else increment(job,"ignored")
            db.execSQL("INSERT INTO processed_messages VALUES(?,?,?,?)",arrayOf(owner,message,outcome,recordId))
          }
        }
        job.put("cursorDate",date).put("cursorId",inboxId.toLong())
      }
      check(canContinue() && !Thread.currentThread().isInterrupted)
      increment(job,"batches")
      if(rows.length() < BATCH_SIZE) {
        job.put("state",if(discovering) "awaiting_account_approval" else "completed")
        if(!discovering) db.execSQL("INSERT OR REPLACE INTO migrations VALUES(?,?,0,1,?)",arrayOf(owner,"sms-incremental-boundary",JSONObject().put("date",job.getLong("boundaryDate")).put("id",job.getLong("boundaryId")).toString()))
      }
      save(db,owner,job)
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
    return job
  }
  fun tick(context: Context, owner: String, id: String): JSONObject {
    MoneyKaiLedger.requireOwner(context,owner)
    val db = MoneyKaiLedger.open(context)
    val job = get(db,owner,id)
    if(job.getString("state") !in listOf("discovering","importing")) return job
    val accounts = job.getJSONArray("selectedAccounts")
    val accountChanged = job.getString("state") == "importing" && (0 until accounts.length()).any { !MoneyKaiNativeCaptureModule.isSmsAccountApproved(context,accounts.getString(it)) }
    if(!allowed(context,owner) || accountChanged || context.noBackupFilesDir.usableSpace < 64L*1024*1024) {
      job.put("resumeState",job.getString("state")).put("state","paused").put("pauseReason",if(accountChanged) "account_selection_changed" else if(!allowed(context,owner)) "permission_or_consent_changed" else "low_storage")
      save(db,owner,job); return job
    }
    return try { processRows(context,db,owner,job,readRows(context,job)) { allowed(context,owner) } }
    catch(error: Exception) {
      if(Thread.currentThread().isInterrupted) throw error
      job.put("resumeState",job.getString("state")).put("state","failed").put("pauseReason","write_or_provider_failure")
      save(db,owner,job); job
    }
  }
  fun request(context: Context, owner: String, request: JSONObject): JSONObject {
    MoneyKaiLedger.requireOwner(context,owner)
    val db = MoneyKaiLedger.open(context)
    return when(request.getString("action")) {
      "start" -> {
        check(allowed(context,owner)) { "Current SMS consent required" }
        val existing = active(db,owner)
        if(existing != null) existing else {
          val (date,id) = boundary(context)
          newJob(owner,request.optLong("fromDate",0),date,id).also { save(db,owner,it); schedule(context) }
        }
      }
      "get" -> get(db,owner,request.getString("id"))
      "latest" -> db.rawQuery("SELECT payload FROM import_jobs WHERE owner=? ORDER BY rowid DESC LIMIT 1",arrayOf(owner)).use { JSONObject().put("job",if(it.moveToFirst()) JSONObject(it.getString(0)) else JSONObject.NULL) }
      "tick" -> tick(context,owner,request.getString("id"))
      "accounts" -> {
        val items = JSONArray()
        db.rawQuery("SELECT payload FROM discovered_accounts WHERE owner=? AND job_id=? AND account_id>? ORDER BY account_id LIMIT 51",arrayOf(owner,request.getString("id"),request.optString("cursor"))).use {
          while(it.moveToNext() && items.length()<50) items.put(JSONObject(it.getString(0)))
          JSONObject().put("items",items).put("nextCursor",if(it.isAfterLast || items.length() == 0) JSONObject.NULL else items.getJSONObject(items.length()-1).getString("id"))
        }
      }
      "select", "pause", "resume", "cancel" -> {
        val job = get(db,owner,request.getString("id"))
        check(job.getString("state") !in listOf("completed","cancelled"))
        when(request.getString("action")) {
          "select" -> {
            check(job.getString("state") == "awaiting_account_approval")
            val selected = request.getJSONArray("accounts")
            require(selected.length() in 1..100)
            for(index in 0 until selected.length()) check(MoneyKaiNativeCaptureModule.isSmsAccountApproved(context,selected.getString(index)))
            job.put("selectedAccounts",selected).put("state","importing").put("cursorDate",job.getLong("boundaryDate")).put("cursorId",job.getLong("boundaryId")+1)
              .put("progress",JSONObject().put("scanned",0).put("parsed",0).put("duplicates",0).put("review",0).put("awaitingSync",0).put("synced",0))
          }
          "pause" -> { if(job.getString("state") != "paused") job.put("resumeState",job.getString("state")); job.put("state","paused").put("pauseReason","user_paused") }
          "resume" -> { check(allowed(context,owner)); job.put("state",job.optString("resumeState","importing")).remove("pauseReason") }
          "cancel" -> job.put("state","cancelled")
        }
        save(db,owner,job); if(job.getString("state") in listOf("discovering","importing")) schedule(context); job
      }
      else -> error("Unsupported import action")
    }
  }
  fun runBackground(context: Context): Boolean {
    val owner = MoneyKaiLedger.activeOwner(context)
    if(owner.isBlank() || !allowed(context,owner)) return false
    val db = MoneyKaiLedger.open(context)
    var job = active(db,owner)
    if(job == null) {
      val after = db.rawQuery("SELECT payload FROM migrations WHERE owner=? AND name='sms-incremental-boundary'",arrayOf(owner)).use { if(it.moveToFirst()) JSONObject(it.getString(0)) else null } ?: return false
      val (date,id) = boundary(context)
      val capture = MoneyKaiPrivateStorage.get(context,"moneykai-auto-capture")?.let { JSONObject(it).optJSONObject("state") } ?: return false
      val monitored = capture.optJSONArray("monitoredAccounts") ?: JSONArray()
      val accounts = JSONArray()
      for(index in 0 until monitored.length()) if(monitored.getJSONObject(index).optString("status") == "approved") accounts.put(monitored.getJSONObject(index).getString("id"))
      if(accounts.length() == 0) return false
      job = newJob(owner,after.getLong("date"),date,id,true).put("after",after).put("selectedAccounts",accounts)
      save(db,owner,job)
    }
    if(job.getString("state") !in listOf("discovering","importing")) return false
    val deadline = System.currentTimeMillis()+10_000
    do { job = tick(context,owner,job!!.getString("id")) } while(job!!.getString("state") in listOf("discovering","importing") && System.currentTimeMillis() < deadline && !Thread.currentThread().isInterrupted)
    return job!!.getString("state") in listOf("discovering","importing")
  }
}
