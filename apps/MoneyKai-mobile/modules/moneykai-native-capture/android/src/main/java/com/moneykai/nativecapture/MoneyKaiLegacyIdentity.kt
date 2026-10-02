package com.moneykai.nativecapture

import org.json.JSONObject

/** Recover only exact account-scoped references; similarity never drops an old record. */
internal object MoneyKaiLegacyIdentity {
  fun normalize(input:JSONObject,table:String):JSONObject {
    val row=JSONObject(input.toString())
    if(row.optString("captureSource")!="sms" || row.optString("importIdentity").isNotBlank())return row
    val account=row.optString("captureAccountId")
    if(account.isBlank() || account.contains("unknown",true))return row
    val key=row.optString("canonicalTransactionKey")
    val hashed=Regex("^txn:ref-hash:([a-f0-9]{64}):").find(key)?.groupValues?.get(1)
    val raw=Regex("^txn:ref:([^:]+):").find(key)?.groupValues?.get(1)
    val reference=hashed ?: raw?.let {MoneyKaiOfflineSmsParser.digest(it.lowercase())} ?: return row
    val accountIdentity=MoneyKaiOfflineSmsParser.digest(account)
    val semantics=row.optString("semantics","payment")
    val amount=MoneyKaiLedger.minor(row)
    val identity=MoneyKaiOfflineSmsParser.digest("reference|$accountIdentity|INR|$amount|${row.getString("type")}|$semantics|$reference")
    row.put("importIdentity",identity).put("accountIdentity",accountIdentity).put("strongIdentity",true)
      .put("parserVersion",row.optString("parserVersion","sms-offline-v1")).put("semantics",semantics)
    if(table=="transactions") row.put("reviewStatus","approved")
    return row
  }
}
