package com.moneykai.nativecapture

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
import android.os.SystemClock
import android.util.Log

/** Large, synthetic only. Does not access the phone inbox or the installed app. */
@RunWith(AndroidJUnit4::class)
class MoneyKaiCapacityTest {
  private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
  private val count=100_000
  private val epoch=1_780_000_000_000L
  private fun batch(offset:Int,mixed:Boolean=false):JSONArray=JSONArray().also{rows->
    for(index in offset until minOf(offset+250,if(mixed)count+10000 else count)) {
      val ignored=mixed && index%11==0
      rows.put(JSONObject().put("id",index.toString()).put("date",epoch-index).put("sender","AX-HDFCBK")
        .put("body",if(ignored)"A/c XX4321 OTP 123456. Do not share." else "A/c XX4321 debited INR 12.34 for payment to Synthetic Cafe. UPI Ref ${100_000_000_000L+index}."))
    }
  }
  private fun job(owner:String)=MoneyKaiLocalImport.newJob(owner,0,epoch,200000).put("state","importing").put("selectedAccounts",JSONArray().put("sms:hdfcbk:ending4321"))
  private fun p95(values:List<Double>)=values.sorted()[((values.size-1)*0.95).toInt()]
  @Test fun oneLakhRetainedReplayedAndQueriedWithBoundedBatches() {
    val owner="capacity-${System.nanoTime()}";MoneyKaiLedger.setOwner(context,owner)
    var db=MoneyKaiLedger.open(context);var state=job(owner)
    val initialBytes=File(context.noBackupFilesDir,"ledger-v1.db").length()
    val idle=Runtime.getRuntime().totalMemory()-Runtime.getRuntime().freeMemory()
    val start=SystemClock.elapsedRealtime()
    for(offset in 0 until count step 250) {
      state=MoneyKaiLocalImport.processRows(context,db,owner,state,batch(offset)){true}
      if(offset==50000){MoneyKaiLedger.close();db=MoneyKaiLedger.open(context);state=MoneyKaiLocalImport.get(db,owner,state.getString("id"))}
      if(offset%10000==0)Log.i("MoneyKaiCapacity","Imported ${offset+250} synthetic records")
    }
    state=MoneyKaiLocalImport.processRows(context,db,owner,state,JSONArray()){true}
    val duration=SystemClock.elapsedRealtime()-start
    assertEquals("completed",state.getString("state"))
    assertEquals(count.toLong(),MoneyKaiLedger.scalar(db,"SELECT count(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    assertEquals(count.toLong(),state.getJSONObject("progress").getLong("parsed"))
    // Approve in bounded transactions. Every draft must survive until that approval.
    var cursor:JSONObject?=null
    do {
      val page=MoneyKaiLedger.page(db,owner,JSONObject().put("table","drafts").put("cursor",cursor).put("limit",100))
      val rows=page.getJSONArray("items");cursor=page.optJSONObject("nextCursor")
      db.beginTransaction()
      try{for(index in 0 until rows.length()){
        val row=rows.getJSONObject(index).put("category","food").put("status","confirmed").put("reviewStatus","approved")
        MoneyKaiLedger.put(db,owner,"transactions",row);MoneyKaiLedger.delete(db,owner,"drafts",row.getString("id"))
      };db.setTransactionSuccessful()}finally{db.endTransaction()}
    }while(cursor!=null)
    assertEquals(count.toLong(),MoneyKaiLedger.scalar(db,"SELECT count(*) FROM transactions WHERE owner=?",arrayOf(owner)))
    assertEquals(0L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    assertEquals(count.toLong()*1234L,MoneyKaiLedger.scalar(db,"SELECT amount_minor FROM summaries WHERE owner=? AND category='' AND direction='expense'",arrayOf(owner)))
    val pageTimes=mutableListOf<Double>();val summaryTimes=mutableListOf<Double>()
    cursor=null
    repeat(100){
      val started=SystemClock.elapsedRealtimeNanos()
      val page=MoneyKaiLedger.page(db,owner,JSONObject().put("limit",50).put("cursor",cursor))
      pageTimes.add((SystemClock.elapsedRealtimeNanos()-started)/1_000_000.0)
      assertEquals(50,page.getJSONArray("items").length());cursor=page.optJSONObject("nextCursor")
      val summaryStart=SystemClock.elapsedRealtimeNanos()
      MoneyKaiLedger.request(context,owner,JSONObject().put("op","summaries").put("month","2026-05"))
      summaryTimes.add((SystemClock.elapsedRealtimeNanos()-summaryStart)/1_000_000.0)
    }
    var replay=job(owner);val replayStart=SystemClock.elapsedRealtime()
    for(offset in 0 until count+10000 step 250)replay=MoneyKaiLocalImport.processRows(context,db,owner,replay,batch(offset,true)){true}
    replay=MoneyKaiLocalImport.processRows(context,db,owner,replay,JSONArray()){true}
    // 100k valid records among 110k inbox messages. 90,909 overlap with the first import.
    assertEquals(100_000L,replay.getJSONObject("progress").getLong("parsed"))
    assertEquals(90_909L,replay.getJSONObject("progress").getLong("duplicates"))
    assertEquals(9091L,MoneyKaiLedger.scalar(db,"SELECT count(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    var repeated=job(owner)
    for(offset in 0 until count step 250)repeated=MoneyKaiLocalImport.processRows(context,db,owner,repeated,batch(offset)){true}
    assertEquals(count.toLong(),repeated.getJSONObject("progress").getLong("duplicates"))
    assertEquals(count.toLong(),MoneyKaiLedger.scalar(db,"SELECT count(*) FROM transactions WHERE owner=?",arrayOf(owner)))
    db.rawQuery("PRAGMA wal_checkpoint(FULL)",emptyArray()).use{it.moveToFirst()}
    val bytes=File(context.noBackupFilesDir,"ledger-v1.db").length()-initialBytes
    val memory=Runtime.getRuntime().totalMemory()-Runtime.getRuntime().freeMemory()-idle
    val results=JSONObject().put("validMessages",count).put("mixedInboxMessages",110000).put("mixedValidMessages",100000)
      .put("parsedImportMs",duration).put("replayAndMixedMs",SystemClock.elapsedRealtime()-replayStart).put("databaseGrowthBytes",bytes)
      .put("pageP95Ms",p95(pageTimes)).put("summaryP95Ms",p95(summaryTimes)).put("nativeHeapDeltaBytes",memory)
      .put("maxTemporaryRows",250).put("device",android.os.Build.MODEL).put("android",android.os.Build.VERSION.RELEASE)
    File(context.filesDir,"sms-capacity-results.json").writeText(results.toString(2))
    Log.i("MoneyKaiCapacity",results.toString())
    assertTrue("Native page p95 target",p95(pageTimes)<200)
    assertTrue("Native summary p95 target",p95(summaryTimes)<100)
  }
}
