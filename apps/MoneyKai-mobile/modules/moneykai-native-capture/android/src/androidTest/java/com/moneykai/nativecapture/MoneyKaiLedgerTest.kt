package com.moneykai.nativecapture

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject
import org.json.JSONArray
import java.io.File

/** Synthetic fixtures in the library test application's sandbox; never reads the real inbox. */
@RunWith(AndroidJUnit4::class)
class MoneyKaiLedgerTest {
  private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
  private fun row(owner: String, id: String, amount: String = "12.34") = JSONObject()
    .put("id",id).put("user_id",owner).put("amount",amount).put("type","expense")
    .put("category","Other").put("description","Synthetic payment").put("transaction_date","2026-10-02").put("status","pending")

  @Test fun encryptedRetentionOwnerScopeAndRollback() {
    val owner = "retention-${System.nanoTime()}"
    MoneyKaiLedger.setOwner(context,owner)
    val db = MoneyKaiLedger.open(context)
    db.beginTransaction()
    try { for(index in 0 until 120) MoneyKaiLedger.put(db,owner,"drafts",row(owner,"d$index")); db.setTransactionSuccessful() } finally { db.endTransaction() }
    assertEquals(120L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM drafts WHERE owner=?",arrayOf(owner)))
    val first = MoneyKaiLedger.page(db,owner,JSONObject().put("table","drafts"))
    assertEquals(50,first.getJSONArray("items").length())
    val second = MoneyKaiLedger.page(db,owner,JSONObject().put("table","drafts").put("cursor",first.getJSONObject("nextCursor")))
    assertEquals(50,second.getJSONArray("items").length())
    assertEquals(0,MoneyKaiLedger.page(db,"other",JSONObject().put("table","drafts")).getJSONArray("items").length())
    db.beginTransaction()
    try { MoneyKaiLedger.put(db,owner,"transactions",row(owner,"rolled-back")) } finally { db.endTransaction() }
    assertNull(MoneyKaiLedger.existing(db,owner,"transactions","rolled-back"))
    val header = File(context.noBackupFilesDir,"ledger-v1.db").inputStream().use { it.readNBytes(16) }.toString(Charsets.UTF_8)
    assertNotEquals("SQLite format 3\u0000",header)
    MoneyKaiLedger.setOwner(context,"other")
    try { MoneyKaiLedger.requireOwner(context,owner); fail("Owner switch must stop work") } catch(_: IllegalArgumentException) { }
  }

  @Test fun restartableMigrationAndExactSummaries() {
    val owner = "migration-${System.nanoTime()}"
    MoneyKaiLedger.setOwner(context,owner)
    val rows = JSONArray()
    for(index in 0 until 1250) rows.put(row(owner,"m$index"))
    val legacy = JSONObject().put("state",JSONObject().put("transactions",rows)).toString()
    MoneyKaiPrivateStorage.set(context,"moneykai-transactions",legacy)
    var db = MoneyKaiLedger.open(context)
    assertFalse(MoneyKaiLedger.migrate(context,db,owner).getBoolean("complete"))
    assertEquals(1000L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM transactions WHERE owner=?",arrayOf(owner)))
    MoneyKaiLedger.close(); db = MoneyKaiLedger.open(context)
    assertTrue(MoneyKaiLedger.migrate(context,db,owner).getBoolean("complete"))
    assertEquals(1250L,MoneyKaiLedger.scalar(db,"SELECT COUNT(*) FROM transactions WHERE owner=?",arrayOf(owner)))
    assertEquals(1250L*1234L,MoneyKaiLedger.scalar(db,"SELECT amount_minor FROM summaries WHERE owner=? AND category=''",arrayOf(owner)))
    assertEquals(legacy,MoneyKaiPrivateStorage.get(context,"moneykai-transactions"))
    db.beginTransaction()
    try { MoneyKaiLedger.put(db,owner,"transactions",row(owner,"m0","20.00")); MoneyKaiLedger.delete(db,owner,"transactions","m1"); db.setTransactionSuccessful() } finally { db.endTransaction() }
    assertEquals(1250L*1234L+2000L-2468L,MoneyKaiLedger.scalar(db,"SELECT amount_minor FROM summaries WHERE owner=? AND category=''",arrayOf(owner)))
    assertTrue(MoneyKaiLedger.migrate(context,db,owner).getBoolean("complete"))
    assertEquals(2000L,MoneyKaiLedger.existing(db,owner,"transactions","m0")!!.getLong("amountMinor"))
  }

  @Test fun missingKeyHasNoPlaintextFallback() {
    MoneyKaiLedger.open(context)
    val key = MoneyKaiPrivateStorage.get(context,"moneykai-ledger-key-v1")!!
    MoneyKaiLedger.close()
    MoneyKaiPrivateStorage.remove(context,"moneykai-ledger-key-v1")
    try { MoneyKaiLedger.open(context); fail("Missing existing key must fail closed") } catch(_: IllegalStateException) { }
    finally { MoneyKaiPrivateStorage.set(context,"moneykai-ledger-key-v1",key) }
  }
}
