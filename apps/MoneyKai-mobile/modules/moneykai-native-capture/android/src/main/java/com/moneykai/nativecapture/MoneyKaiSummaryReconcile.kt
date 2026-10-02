package com.moneykai.nativecapture

import net.zetetic.database.sqlcipher.SQLiteDatabase
import org.json.JSONObject

/** Each checkpoint commits at most 250 rows. Financial writes pause during rebuilding. */
internal object MoneyKaiSummaryReconcile {
  private const val NAME = "local-summary-reconcile-v1"
  fun active(db:SQLiteDatabase,owner:String) = MoneyKaiLedger.scalar(db,
    "SELECT count(*) FROM migrations WHERE owner=? AND name=? AND verified=0",arrayOf(owner,NAME))>0
  fun status(db:SQLiteDatabase,owner:String):JSONObject = db.rawQuery("SELECT payload FROM migrations WHERE owner=? AND name=?",arrayOf(owner,NAME)).use {
    if(it.moveToFirst()) JSONObject(it.getString(0)) else JSONObject().put("state","idle")
  }
  fun step(db:SQLiteDatabase,owner:String,restart:Boolean):JSONObject {
    db.beginTransaction()
    try {
      var job=db.rawQuery("SELECT payload FROM migrations WHERE owner=? AND name=?",arrayOf(owner,NAME)).use {
        if(it.moveToFirst()) JSONObject(it.getString(0)) else null
      }
      if(job==null || restart && job.optString("state")=="completed") {
        job=JSONObject().put("state","clearing").put("scanned",0).put("cursor","")
      }
      if(job.getString("state")=="clearing") {
        db.execSQL("DELETE FROM summaries WHERE rowid IN (SELECT rowid FROM summaries WHERE owner=? LIMIT 250)",arrayOf(owner))
        if(MoneyKaiLedger.scalar(db,"SELECT count(*) FROM summaries WHERE owner=?",arrayOf(owner))==0L) job.put("state","building")
      } else if(job.getString("state")=="building") {
        var count=0
        db.rawQuery("SELECT id,payload FROM transactions WHERE owner=? AND id>? ORDER BY id LIMIT 250",arrayOf(owner,job.getString("cursor"))).use {
          while(it.moveToNext()) {
            MoneyKaiLedger.contribution(db,owner,JSONObject(it.getString(1)),1)
            job.put("cursor",it.getString(0));count++
          }
        }
        job.put("scanned",job.getLong("scanned")+count)
        if(count<250) job.put("state","completed")
      }
      db.execSQL("INSERT OR REPLACE INTO migrations VALUES(?,?,?, ?,?)",arrayOf<Any>(owner,NAME,job.getLong("scanned"),if(job.getString("state")=="completed") 1 else 0,job.toString()))
      db.setTransactionSuccessful()
      return job
    } finally {db.endTransaction()}
  }
}
