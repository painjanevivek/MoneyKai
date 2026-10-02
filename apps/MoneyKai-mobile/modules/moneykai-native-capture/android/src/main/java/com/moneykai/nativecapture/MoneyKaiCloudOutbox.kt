package com.moneykai.nativecapture

import android.content.Context
import net.zetetic.database.sqlcipher.SQLiteDatabase
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/** This queue contains approved DTOs only; raw inbox records never enter it. */
internal object MoneyKaiCloudOutbox {
  fun consent(db: SQLiteDatabase, owner: String): JSONObject = db.rawQuery("SELECT payload FROM consent WHERE owner=?",arrayOf(owner)).use {
    if(it.moveToFirst()) JSONObject(it.getString(0)) else JSONObject().put("enabled",false).put("revision",0).put("version","sms-approved-sync-v1")
  }
  fun saveConsent(db: SQLiteDatabase, owner: String, value: JSONObject) {
    require(value.optString("version","sms-approved-sync-v1") == "sms-approved-sync-v1")
    db.execSQL("INSERT OR REPLACE INTO consent VALUES(?,?)",arrayOf(owner,value.toString()))
    // Keep financial records. Old consent batches cannot become uploadable again.
    if(!value.optBoolean("enabled")) db.execSQL("DELETE FROM outbox WHERE owner=? AND kind IN ('upload','batch')",arrayOf(owner))
  }
  private fun approved(row: JSONObject) = row.optString("captureSource") == "sms" && row.optString("reviewStatus") == "approved" && row.optString("importIdentity").matches(Regex("[a-f0-9]{64}")) && row.optString("accountIdentity").matches(Regex("[a-f0-9]{64}"))
  fun enqueue(db: SQLiteDatabase, owner: String, row: JSONObject, priority: Int = 10) {
    val consent = consent(db,owner)
    if(!consent.optBoolean("enabled") || !approved(row) || row.optString("syncStatus") in listOf("synced","conflict")) return
    db.execSQL("INSERT OR REPLACE INTO outbox VALUES(?,?,'upload',?,0,?,?)",arrayOf(owner,"upload_"+row.getString("id"),priority,consent.getLong("revision"),JSONObject().put("transactionId",row.getString("id")).toString()))
  }
  fun queueDelete(db: SQLiteDatabase, owner: String, row: JSONObject) {
    val inflight = db.rawQuery("SELECT payload FROM outbox WHERE owner=? AND kind='batch' LIMIT 1",arrayOf(owner)).use { it.moveToFirst() && it.getString(0).contains("\"id\":\""+row.getString("id")+"\"") }
    if(!approved(row) || (row.optLong("revision") <= 0 && !inflight)) return
    // Called only by explicit local removal, independent of cloud consent.
    db.execSQL("INSERT OR REPLACE INTO outbox VALUES(?,?,'delete',20,0,0,?)",arrayOf(owner,"delete_"+row.getString("importIdentity"),JSONObject().put("identity",row.getString("importIdentity")).toString()))
  }
  private fun dto(row: JSONObject): JSONObject {
    require(approved(row))
    val result = JSONObject()
    for(key in listOf("id","importIdentity","accountIdentity","amountMinor","currency","type","category","payment_method","transaction_date","parserVersion"))
      if(row.has(key)) result.put(key,row.get(key))
    result.put("semantics",row.optString("semantics","payment")).put("currency","INR").put("parserVersion","sms-offline-v1")
      .put("payment_method",row.optString("payment_method","Other").take(80))
      .put("description",row.optString("counterpartyName","SMS transaction").take(120))
      .put("reviewStatus","approved").put("captureSource","sms").put("expectedRevision",row.optLong("revision"))
    return result
  }
  private fun backfill(db: SQLiteDatabase, owner: String, state: JSONObject) {
    if(!state.optBoolean("enabled") || state.optBoolean("backfillComplete")) return
    val rows = mutableListOf<JSONObject>()
    db.rawQuery("SELECT payload FROM transactions WHERE owner=? AND id>? ORDER BY id LIMIT 250",arrayOf(owner,state.optString("backfillCursor"))).use {
      while(it.moveToNext()) rows.add(JSONObject(it.getString(0)))
    }
    for(row in rows) {
      if(row.optString("syncStatus") != "synced") enqueue(db,owner,row,0)
      state.put("backfillCursor",row.getString("id"))
    }
    state.put("backfillComplete",rows.size < 250)
    saveConsent(db,owner,state)
  }
  fun claim(db: SQLiteDatabase, owner: String): JSONObject {
    val state = consent(db,owner)
    val now = System.currentTimeMillis()
    // A frozen batch precedes fresh edits, guaranteeing replay after a lost reply.
    db.rawQuery("SELECT payload,available_at FROM outbox WHERE owner=? AND kind IN ('batch','delete_batch') ORDER BY id LIMIT 1",arrayOf(owner)).use {
      if(it.moveToFirst()) {
        val batch = JSONObject(it.getString(0))
        if(batch.optString("kind") == "upload" && (!state.optBoolean("enabled") || batch.getJSONObject("payload").getLong("consentRevision") != state.optLong("revision"))) return JSONObject().put("paused","consent_changed")
        return if(it.getLong(1) <= now) batch else JSONObject().put("paused",batch.optString("pauseReason","retry_wait")).put("retryAt",it.getLong(1))
      }
    }
    val deletions = JSONArray(); val deleteIds = mutableListOf<String>()
    db.rawQuery("SELECT id,payload FROM outbox WHERE owner=? AND kind='delete' ORDER BY id LIMIT 50",arrayOf(owner)).use {
      while(it.moveToNext()) { deleteIds.add(it.getString(0)); deletions.put(JSONObject(it.getString(1)).getString("identity")) }
    }
    if(deleteIds.isNotEmpty()) {
      val key = UUID.randomUUID().toString()
      val result = JSONObject().put("id",key).put("kind","delete").put("payload",JSONObject().put("idempotencyKey",key).put("identities",deletions))
      db.execSQL("INSERT INTO outbox VALUES(?,?,'delete_batch',20,0,0,?)",arrayOf(owner,key,result.toString()))
      for(id in deleteIds) db.execSQL("DELETE FROM outbox WHERE owner=? AND id=?",arrayOf(owner,id))
      return result
    }
    if(!state.optBoolean("enabled")) return JSONObject().put("paused","consent_off")
    backfill(db,owner,state)
    val transactions = JSONArray(); val versions = JSONObject(); val queued = mutableListOf<String>()
    db.rawQuery("SELECT id,payload FROM outbox WHERE owner=? AND kind='upload' AND consent_revision=? ORDER BY priority DESC,id LIMIT 50",arrayOf(owner,state.getLong("revision").toString())).use {
      while(it.moveToNext()) {
        val row = MoneyKaiLedger.existing(db,owner,"transactions",JSONObject(it.getString(1)).getString("transactionId"))
        queued.add(it.getString(0))
        if(row != null && approved(row) && row.optString("syncStatus") !in listOf("synced","conflict")) {
          transactions.put(dto(row)); versions.put(row.getString("id"),row.optLong("localRevision"))
        }
      }
    }
    for(id in queued) db.execSQL("DELETE FROM outbox WHERE owner=? AND id=?",arrayOf(owner,id))
    if(transactions.length() == 0) return JSONObject().put("paused",if(state.optBoolean("backfillComplete")) "idle" else "backfill_scanning")
    val key = UUID.randomUUID().toString()
    val jobId = "phone_"+state.getLong("revision")
    val batch = JSONObject().put("id",key).put("kind","upload").put("jobId",jobId).put("localVersions",versions)
      .put("payload",JSONObject().put("consentRevision",state.getLong("revision")).put("idempotencyKey",key).put("transactions",transactions))
    db.execSQL("INSERT INTO outbox VALUES(?,?,'batch',10,0,?,?)",arrayOf(owner,key,state.getLong("revision"),batch.toString()))
    return batch
  }
  fun acknowledge(db: SQLiteDatabase, owner: String, id: String, receipt: JSONObject) {
    val batch = db.rawQuery("SELECT payload FROM outbox WHERE owner=? AND id=? AND kind IN ('batch','delete_batch')",arrayOf(owner,id)).use { if(it.moveToFirst()) JSONObject(it.getString(0)) else null } ?: return
    require(receipt.getString("id") == id)
    if(batch.getString("kind") == "upload") {
      require(receipt.getString("jobId") == batch.getString("jobId"))
      val state = consent(db,owner)
      if(!state.optBoolean("enabled") || state.optLong("revision") != batch.getJSONObject("payload").getLong("consentRevision")) return
      val approved = receipt.getJSONArray("accepted").let { a -> (0 until a.length()).map { a.getString(it) } }.toSet() + receipt.getJSONArray("duplicates").let { a -> (0 until a.length()).map { a.getString(it) } }.toSet()
      val conflicts = receipt.getJSONArray("conflicts").let { a -> (0 until a.length()).map { a.getString(it) } }.toSet()
      val original = batch.getJSONObject("payload").getJSONArray("transactions")
      require(approved.intersect(conflicts).isEmpty() && approved + conflicts == (0 until original.length()).map { original.getJSONObject(it).getString("id") }.toSet())
      for(index in 0 until original.length()) {
        val rowId = original.getJSONObject(index).getString("id")
        val row = MoneyKaiLedger.existing(db,owner,"transactions",rowId) ?: continue
        row.put("revision",receipt.getJSONObject("revisions").getLong(rowId))
        row.put("syncStatus",if(rowId in conflicts) "conflict" else if(row.optLong("localRevision") == batch.getJSONObject("localVersions").getLong(rowId)) "synced" else "pending")
        MoneyKaiLedger.put(db,owner,"transactions",row,false)
      }
    }
    db.execSQL("DELETE FROM outbox WHERE owner=? AND id=?",arrayOf(owner,id))
  }
  fun merge(db: SQLiteDatabase, owner: String, remote: JSONObject) {
    require(remote.optString("user_id",owner) == owner && remote.optString("captureSource") != "notification")
    if(remote.optString("captureSource") == "sms") require(approved(remote))
    val identity = remote.optString("importIdentity")
    val local = if(identity.isNotBlank()) db.rawQuery("SELECT payload FROM transactions WHERE owner=? AND identity=?",arrayOf(owner,identity)).use { if(it.moveToFirst()) JSONObject(it.getString(0)) else null } else MoneyKaiLedger.existing(db,owner,"transactions",remote.getString("id"))
    if(local != null && local.optString("syncStatus") in listOf("pending","conflict") && remote.optLong("revision") > local.optLong("revision")) {
      local.put("syncStatus","conflict").put("remoteConflict",remote)
      MoneyKaiLedger.put(db,owner,"transactions",local,false)
      return
    }
    if(local != null && remote.optLong("revision") < local.optLong("revision")) return
    val row = JSONObject(remote.toString()).put("syncStatus","synced")
    if(local != null) row.put("id",local.getString("id")).put("localRevision",local.optLong("localRevision"))
    MoneyKaiLedger.put(db,owner,"transactions",row,false)
  }
  fun request(context: Context, owner: String, request: JSONObject): JSONObject {
    val db = MoneyKaiLedger.open(context)
    db.beginTransaction()
    try {
      val result = when(request.getString("action")) {
        "consent" -> consent(db,owner)
        "setConsent" -> { saveConsent(db,owner,request.getJSONObject("consent")); consent(db,owner) }
        "claim" -> claim(db,owner)
        "ack" -> { acknowledge(db,owner,request.getString("id"),request.getJSONObject("receipt")); JSONObject().put("committed",true) }
        "defer" -> {
          val id = request.getString("id")
          val batch = db.rawQuery("SELECT payload FROM outbox WHERE owner=? AND id=?",arrayOf(owner,id)).use { if(it.moveToFirst()) JSONObject(it.getString(0)) else null }
          if(batch != null) {
            val attempt = batch.optInt("attempt")+1
            val delay = minOf(21_600_000L,20_000L*(1L shl minOf(attempt,10)))
            batch.put("attempt",attempt).put("pauseReason",request.optString("reason","temporary_failure"))
            db.execSQL("UPDATE outbox SET available_at=?,payload=? WHERE owner=? AND id=?",arrayOf(maxOf(System.currentTimeMillis()+delay,request.optLong("retryAt")),batch.toString(),owner,id))
          }
          JSONObject().put("retained",true)
        }
        "merge" -> { merge(db,owner,request.getJSONObject("row")); JSONObject().put("committed",true) }
        "mergePage" -> {
          val rows = request.getJSONArray("rows"); val deleted = request.getJSONArray("deletedIds")
          require(rows.length() <= 50 && deleted.length() <= 50)
          for(index in 0 until rows.length()) merge(db,owner,rows.getJSONObject(index))
          for(index in 0 until deleted.length()) remoteDelete(db,owner,deleted.getString(index))
          db.execSQL("INSERT OR REPLACE INTO migrations VALUES(?,'cloud-download-state',0,1,?)",arrayOf(owner,request.getJSONObject("state").toString()))
          JSONObject().put("committed",true)
        }
        "remoteDelete" -> {
          remoteDelete(db,owner,request.getString("id"))
          JSONObject().put("committed",true)
        }
        "downloadState" -> db.rawQuery("SELECT payload FROM migrations WHERE owner=? AND name='cloud-download-state'",arrayOf(owner)).use { if(it.moveToFirst()) JSONObject(it.getString(0)) else JSONObject() }
        "setDownloadState" -> { db.execSQL("INSERT OR REPLACE INTO migrations VALUES(?,'cloud-download-state',0,1,?)",arrayOf(owner,request.getJSONObject("state").toString())); JSONObject().put("committed",true) }
        "stats" -> JSONObject().put("awaitingSync",MoneyKaiLedger.scalar(db,"SELECT count(*) FROM transactions WHERE owner=? AND sync IN ('pending','local_only') AND identity IS NOT NULL",arrayOf(owner)))
          .put("synced",MoneyKaiLedger.scalar(db,"SELECT count(*) FROM transactions WHERE owner=? AND sync='synced'",arrayOf(owner)))
          .put("conflicts",MoneyKaiLedger.scalar(db,"SELECT count(*) FROM transactions WHERE owner=? AND sync='conflict'",arrayOf(owner)))
          .put("pendingDeletions",MoneyKaiLedger.scalar(db,"SELECT count(*) FROM outbox WHERE owner=? AND kind IN ('delete','delete_batch')",arrayOf(owner)))
        else -> error("Unsupported cloud queue action")
      }
      db.setTransactionSuccessful(); return result
    } finally { db.endTransaction() }
  }
  private fun remoteDelete(db: SQLiteDatabase, owner: String, id: String) {
    val identity = id.removePrefix("sms_")
    val row = db.rawQuery("SELECT payload FROM transactions WHERE owner=? AND (id=? OR identity=?) LIMIT 1",arrayOf(owner,id,identity)).use { if(it.moveToFirst()) JSONObject(it.getString(0)) else null }
    if(row != null) {
      if(row.optString("syncStatus") in listOf("pending","conflict")) {
        row.put("syncStatus","conflict").put("remoteConflictDeleted",true); MoneyKaiLedger.put(db,owner,"transactions",row,false)
      } else MoneyKaiLedger.delete(db,owner,"transactions",row.getString("id"),false)
    }
  }
}
