package com.moneykai.nativecapture

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject
import org.json.JSONArray

@RunWith(AndroidJUnit4::class)
class MoneyKaiCloudOutboxTest {
  private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
  private fun approved(owner:String,id:String,identity:String) = JSONObject().put("id",id).put("user_id",owner).put("importIdentity",identity).put("accountIdentity","b".repeat(64))
    .put("amount",12.34).put("amountMinor",1234).put("type","expense").put("category","Other").put("transaction_date","2026-10-02")
    .put("captureSource","sms").put("reviewStatus","approved").put("snippet","must stay local").put("counterpartyName","Synthetic merchant")
  private fun request(owner:String,action:String,extra:JSONObject=JSONObject()):JSONObject {
    extra.put("op","cloud").put("action",action); return MoneyKaiLedger.request(context,owner,extra)
  }
  @Test fun frozenReplayApprovalPrivacyRevocationAndOwnerIsolation() {
    val owner="outbox-${System.nanoTime()}"; MoneyKaiLedger.setOwner(context,owner)
    val db=MoneyKaiLedger.open(context)
    MoneyKaiLedger.put(db,owner,"transactions",approved(owner,"local-1","a".repeat(64)))
    assertEquals("consent_off",request(owner,"claim").getString("paused"))
    request(owner,"setConsent",JSONObject().put("consent",JSONObject().put("enabled",true).put("revision",1)))
    val batch=request(owner,"claim"); val dto=batch.getJSONObject("payload").getJSONArray("transactions").getJSONObject(0)
    assertFalse(dto.has("snippet")); assertFalse(dto.has("body"))
    MoneyKaiLedger.close()
    assertEquals(batch.toString(),request(owner,"claim").toString())
    val updated=MoneyKaiLedger.existing(MoneyKaiLedger.open(context),owner,"transactions","local-1")!!.put("amount",20).put("amountMinor",2000)
    MoneyKaiLedger.put(MoneyKaiLedger.open(context),owner,"transactions",updated)
    val receipt=JSONObject().put("id",batch.getString("id")).put("jobId",batch.getString("jobId")).put("accepted",JSONArray().put("local-1")).put("duplicates",JSONArray()).put("conflicts",JSONArray()).put("revisions",JSONObject().put("local-1",1))
    request(owner,"ack",JSONObject().put("id",batch.getString("id")).put("receipt",receipt))
    assertEquals("pending",MoneyKaiLedger.existing(MoneyKaiLedger.open(context),owner,"transactions","local-1")!!.getString("syncStatus"))
    val next=request(owner,"claim")
    assertEquals(2000,next.getJSONObject("payload").getJSONArray("transactions").getJSONObject(0).getInt("amountMinor"))
    request(owner,"setConsent",JSONObject().put("consent",JSONObject().put("enabled",false).put("revision",2)))
    assertEquals("consent_off",request(owner,"claim").getString("paused"))
    assertNotNull(MoneyKaiLedger.existing(MoneyKaiLedger.open(context),owner,"transactions","local-1"))
    MoneyKaiLedger.setOwner(context,"other")
    try { request(owner,"claim"); fail("Stale owner must be rejected") } catch(_:IllegalArgumentException) {}
  }
  @Test fun remoteIdentityMergeAndConflictPreserveLocalEdits() {
    val owner="merge-${System.nanoTime()}"; MoneyKaiLedger.setOwner(context,owner)
    val db=MoneyKaiLedger.open(context)
    val local=approved(owner,"phone-id","c".repeat(64)).put("revision",1).put("syncStatus","synced")
    MoneyKaiLedger.put(db,owner,"transactions",local,false)
    val remote=approved(owner,"sms_"+"c".repeat(64),"c".repeat(64)).put("revision",2).put("category","Food")
    request(owner,"merge",JSONObject().put("row",remote))
    assertEquals(1L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM transactions WHERE owner=?",arrayOf(owner)))
    assertEquals("Food",MoneyKaiLedger.existing(db,owner,"transactions","phone-id")!!.getString("category"))
    MoneyKaiLedger.put(db,owner,"transactions",MoneyKaiLedger.existing(db,owner,"transactions","phone-id")!!.put("category","Local edit"))
    request(owner,"merge",JSONObject().put("row",remote.put("revision",3)))
    val conflict=MoneyKaiLedger.existing(db,owner,"transactions","phone-id")!!
    assertEquals("Local edit",conflict.getString("category")); assertEquals("conflict",conflict.getString("syncStatus"))
  }
}
