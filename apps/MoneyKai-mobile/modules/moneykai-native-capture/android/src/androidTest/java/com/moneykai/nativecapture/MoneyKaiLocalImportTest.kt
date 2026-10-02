package com.moneykai.nativecapture

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject
import org.json.JSONArray

@RunWith(AndroidJUnit4::class)
class MoneyKaiLocalImportTest {
  private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
  private fun rows(offset: Int = 0, count: Int = 250): JSONArray = JSONArray().also { result ->
    for(index in offset until offset+count) result.put(JSONObject().put("id","$index").put("date",1_780_000_000_000L-index)
      .put("sender","AX-HDFCBK").put("body","A/c XX4321 debited INR 12.34 for payment to Synthetic Cafe. UPI Ref ${100_000_000_000L+index}."))
  }
  @Test fun atomicCheckpointsRecoveryAndReplay() {
    val owner = "job-${System.nanoTime()}"; MoneyKaiLedger.setOwner(context,owner)
    var db = MoneyKaiLedger.open(context)
    val job = MoneyKaiLocalImport.newJob(owner,0,1_780_000_000_000L,10000)
      .put("state","importing").put("selectedAccounts",JSONArray().put("sms:hdfcbk:ending4321"))
    MoneyKaiLocalImport.save(db,owner,job)
    var committed = MoneyKaiLocalImport.processRows(context,db,owner,job,rows()) { true }
    assertEquals(250L,committed.getJSONObject("progress").getLong("scanned"))
    assertEquals(250L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    var checks = 0
    try { MoneyKaiLocalImport.processRows(context,db,owner,committed,rows(250)) { ++checks < 2 }; fail("Interrupted commit must rollback") } catch(_: IllegalStateException) { }
    assertEquals(250L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    assertEquals(committed.toString(),MoneyKaiLocalImport.get(db,owner,job.getString("id")).toString())
    MoneyKaiLedger.close(); db = MoneyKaiLedger.open(context)
    committed = MoneyKaiLocalImport.processRows(context,db,owner,MoneyKaiLocalImport.get(db,owner,job.getString("id")),rows(250)) { true }
    assertEquals(500L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    val replay = MoneyKaiLocalImport.newJob(owner,0,1_780_000_000_000L,10000).put("state","importing").put("selectedAccounts",JSONArray().put("sms:hdfcbk:ending4321"))
    val repeated = MoneyKaiLocalImport.processRows(context,db,owner,replay,rows()) { true }
    assertEquals(250L,repeated.getJSONObject("progress").getLong("duplicates"))
    assertEquals(500L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    MoneyKaiLocalImport.request(context,owner,JSONObject().put("action","cancel").put("id",job.getString("id")))
    assertEquals("cancelled",MoneyKaiLocalImport.get(db,owner,job.getString("id")).getString("state"))
    assertEquals(500L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM drafts WHERE owner=?",arrayOf(owner)))
  }
}
