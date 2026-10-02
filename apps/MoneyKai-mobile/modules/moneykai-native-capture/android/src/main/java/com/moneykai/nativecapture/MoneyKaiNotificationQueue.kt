package com.moneykai.nativecapture

import android.content.Context
import android.os.Bundle
import org.json.JSONObject
import org.json.JSONArray

/** Unprocessed notifications are encrypted until a processing outcome commits. */
internal object MoneyKaiNotificationQueue {
  fun enqueue(context:Context,event:Bundle):String {
    val owner=event.getString("notificationOwnerId").orEmpty()
    MoneyKaiLedger.requireOwner(context,owner)
    val payload=JSONObject()
    for(key in event.keySet())payload.put(key,event.get(key))
    val id=MoneyKaiOfflineSmsParser.digest(payload.toString())
    payload.put("nativeCaptureEventId",id)
    val db=MoneyKaiLedger.open(context)
    db.execSQL("INSERT OR IGNORE INTO capture_events VALUES(?,?,?)",arrayOf(owner,id,payload.toString()))
    return id
  }
  fun page(context:Context,owner:String):JSONObject {
    MoneyKaiLedger.requireOwner(context,owner)
    val events=JSONArray()
    MoneyKaiLedger.open(context).rawQuery("SELECT payload FROM capture_events WHERE owner=? ORDER BY rowid LIMIT 25",arrayOf(owner)).use{
      while(it.moveToNext())events.put(JSONObject(it.getString(0)))
    }
    return JSONObject().put("events",events)
  }
}
