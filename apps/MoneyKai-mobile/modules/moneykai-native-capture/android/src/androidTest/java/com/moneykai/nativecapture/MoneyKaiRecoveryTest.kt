package com.moneykai.nativecapture

import android.os.Bundle
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject

@RunWith(AndroidJUnit4::class)
class MoneyKaiRecoveryTest {
  private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
  private fun owner(prefix:String)="$prefix-${System.nanoTime()}".also {MoneyKaiLedger.setOwner(context,it)}
  private fun row(owner:String,id:String)=JSONObject().put("id",id).put("user_id",owner).put("amount",12.34)
    .put("type","expense").put("category","food").put("description","Synthetic cafe").put("transaction_date","2026-10-02")
  @Test fun nicknameTravelsInFrozenBatchAndNewerLocalEditSurvivesAcknowledgement() {
    val owner=owner("nickname");val db=MoneyKaiLedger.open(context)
    MoneyKaiCloudOutbox.saveConsent(db,owner,JSONObject().put("enabled",true).put("revision",1).put("backfillComplete",true))
    val local=row(owner,"nick").put("counterpartyName","Synthetic cafe").put("captureSource","sms").put("reviewStatus","approved")
      .put("importIdentity","a".repeat(64)).put("accountIdentity","b".repeat(64)).put("nickname","My cafe")
    MoneyKaiLedger.put(db,owner,"transactions",local)
    val batch=MoneyKaiCloudOutbox.claim(db,owner,JSONObject().put("synthetic cafe","Older alias"))
    val dto=batch.getJSONObject("payload").getJSONArray("transactions").getJSONObject(0)
    assertEquals("My cafe",dto.getString("nickname"));assertEquals("Synthetic cafe",dto.getString("description"))
    assertFalse(dto.has("aliases"));assertFalse(dto.has("body"))
    MoneyKaiLedger.put(db,owner,"transactions",local.put("nickname","New cafe"))
    assertEquals("My cafe",MoneyKaiCloudOutbox.claim(db,owner).getJSONObject("payload").getJSONArray("transactions").getJSONObject(0).getString("nickname"))
    val receipt=JSONObject().put("id",batch.getString("id")).put("jobId",batch.getString("jobId"))
      .put("accepted",org.json.JSONArray().put("nick")).put("duplicates",org.json.JSONArray()).put("conflicts",org.json.JSONArray()).put("revisions",JSONObject().put("nick",1))
    MoneyKaiCloudOutbox.acknowledge(db,owner,batch.getString("id"),receipt)
    assertEquals("New cafe",MoneyKaiLedger.existing(db,owner,"transactions","nick")!!.getString("nickname"))
    val next=MoneyKaiCloudOutbox.claim(db,owner)
    assertEquals("New cafe",next.getJSONObject("payload").getJSONArray("transactions").getJSONObject(0).getString("nickname"))
    val restoredOwner=owner("nickname-restored")
    val remote=JSONObject(local.toString()).put("user_id",restoredOwner).put("revision",2).put("nickname","Cloud cafe")
    MoneyKaiCloudOutbox.merge(db,restoredOwner,remote)
    MoneyKaiLedger.close()
    assertEquals("Cloud cafe",MoneyKaiLedger.existing(MoneyKaiLedger.open(context),restoredOwner,"transactions","nick")!!.getString("nickname"))
  }
  @Test fun legacyReferenceIdentityMatchesOfflineParserWithoutWeakMerging() {
    val owner=owner("legacy-identity")
    val text="A/c XX4321 debited INR 12.34 for payment to Synthetic Cafe. UPI Ref 100000000001."
    val parsed=MoneyKaiOfflineSmsParser.parse(context,"AX-HDFCBK",text,1780000000000L,"1")!!
    val old=row(owner,"old-id").put("captureSource","sms").put("captureAccountId",parsed.getString("captureAccountId"))
      .put("canonicalTransactionKey","txn:ref-hash:${MoneyKaiSmsAutoRecord.referenceHash(text)}:expense:12.34")
    val migrated=MoneyKaiLegacyIdentity.normalize(old,"transactions")
    assertEquals(parsed.getString("importIdentity"),migrated.getString("importIdentity"))
    assertEquals("old-id",migrated.getString("id"))
    assertFalse(MoneyKaiLegacyIdentity.normalize(row(owner,"weak").put("captureSource","sms").put("captureAccountId",parsed.getString("captureAccountId")),"transactions").has("importIdentity"))
    assertFalse(MoneyKaiLegacyIdentity.normalize(old.put("captureAccountId","unknown-account"),"transactions").has("importIdentity"))
  }
  @Test fun notificationQueueRetainsMoreThan100AndAcknowledgesOnlyCommittedOutcomes() {
    val owner=owner("notifications")
    repeat(120) {index->MoneyKaiNotificationQueue.enqueue(context,Bundle().apply {
      putString("notificationOwnerId",owner);putString("source","notification");putString("body","Synthetic notification $index")
    })}
    var db=MoneyKaiLedger.open(context)
    assertEquals(120L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM capture_events WHERE owner=?",arrayOf(owner)))
    MoneyKaiLedger.close();db=MoneyKaiLedger.open(context)
    val events=MoneyKaiNotificationQueue.page(context,owner).getJSONArray("events")
    assertEquals(25,events.length())
    val id=events.getJSONObject(0).getString("nativeCaptureEventId")
    val request=JSONObject().put("op","captureOutcome").put("identity","e".repeat(64)).put("eventId",id)
      .put("row",row(owner,"draft").put("amount",-1))
    try {MoneyKaiLedger.request(context,owner,request);fail("Invalid write must roll back acknowledgement")}catch(_:IllegalArgumentException){}
    assertEquals(120L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM capture_events WHERE owner=?",arrayOf(owner)))
    request.put("row",row(owner,"draft"))
    MoneyKaiLedger.request(context,owner,request);MoneyKaiLedger.request(context,owner,request)
    assertEquals(119L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM capture_events WHERE owner=?",arrayOf(owner)))
    assertEquals(1L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    MoneyKaiLedger.setOwner(context,"other")
    try{MoneyKaiNotificationQueue.page(context,owner);fail("Owner switch must stop queue access")}catch(_:IllegalArgumentException){}
  }
  @Test fun summaryRebuildResumesAndBlocksInterleavedFinancialEdits() {
    val owner=owner("reconcile");var db=MoneyKaiLedger.open(context)
    db.beginTransaction();try{repeat(751){MoneyKaiLedger.put(db,owner,"transactions",row(owner,"r$it"))};db.setTransactionSuccessful()}finally{db.endTransaction()}
    db.execSQL("UPDATE summaries SET amount_minor=1 WHERE owner=?",arrayOf(owner))
    assertEquals("building",MoneyKaiSummaryReconcile.step(db,owner,false).getString("state"))
    assertEquals(250L,MoneyKaiSummaryReconcile.step(db,owner,false).getLong("scanned"))
    try{MoneyKaiLedger.put(db,owner,"transactions",row(owner,"edit"));fail("Writes must pause while totals rebuild")}catch(_:IllegalStateException){}
    MoneyKaiLedger.close();db=MoneyKaiLedger.open(context)
    var job=MoneyKaiSummaryReconcile.status(db,owner)
    while(job.getString("state")!="completed")job=MoneyKaiSummaryReconcile.step(db,owner,false)
    assertEquals(751L,job.getLong("scanned"))
    assertEquals(751L*1234,MoneyKaiLedger.scalar(db,"SELECT amount_minor FROM summaries WHERE owner=? AND category=''",arrayOf(owner)))
    MoneyKaiSummaryReconcile.step(db,owner,false)
    assertEquals(751L*1234,MoneyKaiLedger.scalar(db,"SELECT amount_minor FROM summaries WHERE owner=? AND category=''",arrayOf(owner)))
    try{MoneyKaiLedger.put(db,owner,"transactions",row(owner,"invalid-date").put("transaction_date","2026-02-30"));fail("Invalid calendar date")}catch(_:java.time.DateTimeException){}
  }
  @Test fun equalCloudRevisionPreservesPendingEditAndConflictResolutionIsExplicit() {
    val owner=owner("revision");val db=MoneyKaiLedger.open(context)
    val local=row(owner,"phone").put("captureSource","sms").put("reviewStatus","approved").put("importIdentity","f".repeat(64))
      .put("accountIdentity","b".repeat(64)).put("revision",2).put("syncStatus","pending")
    MoneyKaiLedger.put(db,owner,"transactions",local,false)
    val remote=JSONObject(local.toString()).put("id","sms_"+"f".repeat(64)).put("category","website")
    MoneyKaiCloudOutbox.merge(db,owner,remote)
    assertEquals("food",MoneyKaiLedger.existing(db,owner,"transactions","phone")!!.getString("category"))
    MoneyKaiCloudOutbox.merge(db,owner,remote.put("revision",3))
    assertEquals("conflict",MoneyKaiLedger.existing(db,owner,"transactions","phone")!!.getString("syncStatus"))
    MoneyKaiLedger.request(context,owner,JSONObject().put("op","cloud").put("action","resolveConflict").put("id","phone").put("choice","website"))
    assertEquals("website",MoneyKaiLedger.existing(db,owner,"transactions","phone")!!.getString("category"))
    assertEquals(1L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM transactions WHERE owner=?",arrayOf(owner)))
  }
}
