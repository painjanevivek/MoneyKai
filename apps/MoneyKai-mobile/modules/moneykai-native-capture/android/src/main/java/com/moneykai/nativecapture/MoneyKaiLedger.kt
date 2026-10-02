package com.moneykai.nativecapture

import android.content.Context
import net.zetetic.database.sqlcipher.SQLiteDatabase
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.math.BigDecimal
import java.security.SecureRandom
import java.util.concurrent.Executors

/** All writers, including inbox workers, use this executor and committed checkpoints. */
internal object MoneyKaiLedger {
  val executor = Executors.newSingleThreadExecutor()
  private var database: SQLiteDatabase? = null
  private const val KEY = "moneykai-ledger-key-v1"
  private const val OWNER = "moneykai-ledger-active-owner"
  @Synchronized fun close() { database?.close(); database = null }

  @Synchronized fun open(context: Context): SQLiteDatabase {
    database?.let { return it }
    System.loadLibrary("sqlcipher")
    val file = File(context.noBackupFilesDir, "ledger-v1.db")
    var key = MoneyKaiPrivateStorage.get(context, KEY)
    check(key != null || !file.exists()) { "Existing encrypted ledger key is unavailable" }
    if (key == null) {
      key = ByteArray(32).also { SecureRandom().nextBytes(it) }.joinToString("") { "%02x".format(it) }
      MoneyKaiPrivateStorage.set(context, KEY, key)
    }
    val db = SQLiteDatabase.openOrCreateDatabase(file, key, null, null, null)
    db.enableWriteAheadLogging()
    db.execSQL("PRAGMA synchronous=FULL")
    db.execSQL("PRAGMA cipher_memory_security=ON")
    db.beginTransaction()
    try {
      for (table in listOf("transactions", "drafts")) {
        db.execSQL("""CREATE TABLE IF NOT EXISTS $table (
          owner TEXT NOT NULL, id TEXT NOT NULL, day TEXT NOT NULL, amount_minor INTEGER NOT NULL,
          direction TEXT NOT NULL, account TEXT NOT NULL, category TEXT NOT NULL, merchant TEXT NOT NULL,
          review TEXT NOT NULL, sync TEXT NOT NULL, identity TEXT, revision INTEGER NOT NULL DEFAULT 0,
          payload TEXT NOT NULL, PRIMARY KEY(owner,id))""")
        db.execSQL("CREATE INDEX IF NOT EXISTS ${table}_date ON $table(owner,day DESC,id DESC)")
        for (field in listOf("account", "category", "review", "sync", "direction", "merchant"))
          db.execSQL("CREATE INDEX IF NOT EXISTS ${table}_$field ON $table(owner,$field,day DESC,id DESC)")
        db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS ${table}_identity ON $table(owner,identity) WHERE identity IS NOT NULL")
      }
      db.execSQL("CREATE TABLE IF NOT EXISTS processed_messages(owner TEXT NOT NULL, identity TEXT NOT NULL, outcome TEXT NOT NULL, record_id TEXT, PRIMARY KEY(owner,identity))")
      db.execSQL("CREATE TABLE IF NOT EXISTS import_jobs(owner TEXT NOT NULL,id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(owner,id))")
      db.execSQL("CREATE INDEX IF NOT EXISTS import_jobs_state ON import_jobs(owner,state)")
      db.execSQL("CREATE TABLE IF NOT EXISTS discovered_accounts(owner TEXT NOT NULL,job_id TEXT NOT NULL,account_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(owner,job_id,account_id))")
      db.execSQL("CREATE TABLE IF NOT EXISTS outbox(owner TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,priority INTEGER NOT NULL,available_at INTEGER NOT NULL,consent_revision INTEGER NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(owner,id))")
      db.execSQL("CREATE INDEX IF NOT EXISTS outbox_ready ON outbox(owner,available_at,priority DESC,id)")
      db.execSQL("CREATE TABLE IF NOT EXISTS summaries(owner TEXT NOT NULL,month TEXT NOT NULL,category TEXT NOT NULL,direction TEXT NOT NULL,amount_minor INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(owner,month,category,direction))")
      db.execSQL("CREATE TABLE IF NOT EXISTS migrations(owner TEXT NOT NULL,name TEXT NOT NULL,cursor INTEGER NOT NULL,verified INTEGER NOT NULL DEFAULT 0,payload TEXT NOT NULL,PRIMARY KEY(owner,name))")
      db.execSQL("CREATE TABLE IF NOT EXISTS consent(owner TEXT PRIMARY KEY,payload TEXT NOT NULL)")
      db.execSQL("PRAGMA user_version=1")
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
    database = db
    return db
  }

  fun activeOwner(context: Context) = MoneyKaiPrivateStorage.get(context, OWNER) ?: ""
  fun setOwner(context: Context, owner: String) { MoneyKaiPrivateStorage.set(context, OWNER, owner) }
  fun requireOwner(context: Context, owner: String) { require(owner.isNotBlank() && owner == activeOwner(context)) { "Ledger owner changed" } }
  fun minor(row: JSONObject): Long {
    val converted = BigDecimal(row.get("amount").toString()).movePointRight(2).longValueExact()
    require(converted > 0 && converted <= 100_000_000_000_000L)
    if (row.has("amountMinor")) require(row.getLong("amountMinor") == converted)
    return converted
  }
  fun existing(db: SQLiteDatabase, owner: String, table: String, id: String): JSONObject? {
    require(table in listOf("transactions", "drafts"))
    db.rawQuery("SELECT payload FROM $table WHERE owner=? AND id=?", arrayOf(owner,id)).use { cursor ->
      return if (cursor.moveToFirst()) JSONObject(cursor.getString(0)) else null
    }
  }
  fun scalar(db: SQLiteDatabase, sql: String, args: Array<String>): Long = db.rawQuery(sql,args).use { if(it.moveToFirst()) it.getLong(0) else 0L }
  fun contribution(db: SQLiteDatabase, owner: String, row: JSONObject, sign: Int) {
    if (row.optString("semantics") == "transfer") return
    val month = row.getString("transaction_date").take(7)
    for (category in listOf("", row.getString("category"))) {
      val args = arrayOf(owner,month,category,row.getString("type"))
      db.execSQL("INSERT OR IGNORE INTO summaries VALUES(?,?,?,?,0,0)", args)
      db.execSQL("UPDATE summaries SET amount_minor=amount_minor+?,count=count+? WHERE owner=? AND month=? AND category=? AND direction=?", arrayOf(minor(row)*sign,sign,*args))
    }
  }
  fun put(db: SQLiteDatabase, owner: String, table: String, input: JSONObject, localEdit: Boolean = true) {
    require(table in listOf("transactions", "drafts"))
    val row = JSONObject(input.toString())
    require(row.optString("user_id",owner) == owner)
    val id = row.getString("id")
    require(id.length in 1..160)
    val amount = minor(row)
    row.put("amountMinor",amount).put("currency","INR").put("user_id",owner)
    val previous = existing(db,owner,table,id)
    if(table == "transactions" && localEdit) {
      row.put("localRevision",(previous?.optLong("localRevision") ?: 0)+1)
      if(row.optString("captureSource") == "sms" && row.optString("reviewStatus") == "approved")
        row.put("syncStatus",if(row.optLong("revision") > 0 || MoneyKaiCloudOutbox.consent(db,owner).optBoolean("enabled")) "pending" else "local_only")
    }
    if (table == "transactions" && previous != null) contribution(db,owner,previous,-1)
    val identity = row.optString("importIdentity").takeIf { it.isNotBlank() }
    val columns = listOf("day","amount_minor","direction","account","category","merchant","review","sync","identity","revision","payload")
    val statement = db.compileStatement("INSERT INTO $table(owner,id,${columns.joinToString(",")}) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET ${columns.joinToString(",") { "$it=excluded.$it" }}")
    statement.use {
      val values = listOf(owner,id,row.getString("transaction_date"),amount,row.getString("type"),row.optString("accountIdentity",row.optString("captureAccountId")),row.optString("category","Other"),row.optString("counterpartyName",row.optString("description")).lowercase(),row.optString("status",row.optString("reviewStatus","approved")),row.optString("syncStatus","local_only"),identity,row.optLong("revision"),row.toString())
      values.forEachIndexed { index,value -> when(value) { null -> it.bindNull(index+1); is Long -> it.bindLong(index+1,value); else -> it.bindString(index+1,value.toString()) } }
      it.executeInsert()
    }
    if (table == "transactions") {
      contribution(db,owner,row,1)
      MoneyKaiCloudOutbox.enqueue(db,owner,row)
    }
  }
  fun delete(db: SQLiteDatabase, owner: String, table: String, id: String, queueCloud: Boolean = true) {
    val previous = existing(db,owner,table,id) ?: return
    if (table == "transactions") {
      contribution(db,owner,previous,-1)
      if(queueCloud) MoneyKaiCloudOutbox.queueDelete(db,owner,previous)
      db.execSQL("DELETE FROM outbox WHERE owner=? AND id=?",arrayOf(owner,"upload_"+id))
    }
    db.execSQL("DELETE FROM $table WHERE owner=? AND id=?",arrayOf(owner,id))
  }
  fun page(db: SQLiteDatabase, owner: String, request: JSONObject): JSONObject {
    val table = request.optString("table","transactions")
    require(table in listOf("transactions","drafts"))
    val limit = request.optInt("limit",50).coerceIn(1,100)
    val where = mutableListOf("owner=?")
    val args = mutableListOf(owner)
    for ((input,column) in mapOf("account" to "account","category" to "category","review" to "review","sync" to "sync","direction" to "direction"))
      if (request.has(input)) { where.add("$column=?"); args.add(request.getString(input)) }
    for ((input,operator) in mapOf("from" to ">=", "to" to "<="))
      if (request.has(input)) { where.add("day$operator?"); args.add(request.getString(input)) }
    if (request.has("merchantPrefix")) {
      where.add("merchant>=? AND merchant<?")
      val prefix = request.getString("merchantPrefix").lowercase().take(120)
      args.add(prefix); args.add(prefix+"\uffff")
    }
    request.optJSONObject("cursor")?.let { where.add("(day<? OR (day=? AND id<?))"); args.add(it.getString("day")); args.add(it.getString("day")); args.add(it.getString("id")) }
    val items = JSONArray()
    var next: JSONObject? = null
    db.rawQuery("SELECT payload,day,id FROM $table WHERE ${where.joinToString(" AND ")} ORDER BY day DESC,id DESC LIMIT ${limit+1}",args.toTypedArray()).use {
      while(it.moveToNext()) {
        if(items.length() == limit) break
        items.put(JSONObject(it.getString(0)))
        next = JSONObject().put("day",it.getString(1)).put("id",it.getString(2))
      }
      if(it.isAfterLast) next = null
    }
    return JSONObject().put("items",items).put("nextCursor",next ?: JSONObject.NULL)
  }
  /** Old ciphertext is retained. Each 250-row migration checkpoint is restartable. */
  fun migrate(context: Context, db: SQLiteDatabase, owner: String): JSONObject {
    for ((name,table,field) in listOf(Triple("moneykai-transactions","transactions","transactions"),Triple("moneykai-auto-capture","drafts","drafts"))) {
      if(scalar(db,"SELECT verified FROM migrations WHERE owner=? AND name=?",arrayOf(owner,name)) == 1L) continue
      val raw = MoneyKaiPrivateStorage.get(context,name) ?: continue
      val rows = JSONObject(raw).getJSONObject("state").optJSONArray(field) ?: JSONArray()
      var offset = scalar(db,"SELECT cursor FROM migrations WHERE owner=? AND name=?", arrayOf(owner,name)).toInt()
      var chunks = 0
      while(offset < rows.length() && chunks++ < 4) {
        db.beginTransaction()
        try {
          val end = minOf(offset+250,rows.length())
          for(index in offset until end) {
            val row = rows.getJSONObject(index)
            if(row.optString("user_id") == owner) put(db,owner,table,row)
          }
          db.execSQL("INSERT OR REPLACE INTO migrations VALUES(?,?,?,0,?)", arrayOf<Any>(owner,name,end,"{}"))
          db.setTransactionSuccessful(); offset = end
        } finally { db.endTransaction() }
      }
      if(offset < rows.length()) return JSONObject().put("complete",false)
      var verified = 0
      for(index in 0 until rows.length()) {
        val row = rows.getJSONObject(index)
        if(row.optString("user_id") != owner) continue
        val actual = existing(db,owner,table,row.getString("id")) ?: error("Migration record missing")
        check(actual.getString("id") == row.getString("id") && minor(actual) == minor(row))
        verified++
      }
      db.execSQL("UPDATE migrations SET verified=1,payload=? WHERE owner=? AND name=?",arrayOf(JSONObject().put("records",verified).toString(),owner,name))
    }
    return JSONObject().put("complete",true)
  }

  fun request(context: Context, owner: String, request: JSONObject): JSONObject {
    if(request.getString("op") == "owner") { setOwner(context,owner); return JSONObject().put("owner",owner) }
    requireOwner(context,owner)
    val db = open(context)
    return when(request.getString("op")) {
      "features" -> { MoneyKaiLocalImport.configure(context,request.getBoolean("enabled")); JSONObject().put("configured",true) }
      "import" -> MoneyKaiLocalImport.request(context,owner,request)
      "cloud" -> MoneyKaiCloudOutbox.request(context,owner,request)
      "get" -> JSONObject().put("row",existing(db,owner,request.getString("table"),request.getString("id")) ?: JSONObject.NULL)
      "approve" -> {
        db.beginTransaction()
        try {
          val row = existing(db,owner,"drafts",request.getString("id")) ?: error("Draft missing")
          row.put("category",request.getString("category")).put("reviewStatus","approved").put("status","confirmed").put("syncStatus","pending")
          put(db,owner,"transactions",row)
          delete(db,owner,"drafts",row.getString("id"))
          db.setTransactionSuccessful()
        } finally { db.endTransaction() }
        JSONObject().put("committed",true)
      }
      "migrate" -> migrate(context,db,owner)
      "page" -> page(db,owner,request)
      "summaries" -> {
        val items = JSONArray()
        db.rawQuery("SELECT month,category,direction,amount_minor,count FROM summaries WHERE owner=? AND month=?",arrayOf(owner,request.getString("month"))).use {
          while(it.moveToNext()) items.put(JSONObject().put("month",it.getString(0)).put("category",it.getString(1)).put("direction",it.getString(2)).put("amountMinor",it.getLong(3)).put("count",it.getLong(4)))
        }
        JSONObject().put("items",items)
      }
      "put", "delete" -> {
        val table = request.getString("table")
        db.beginTransaction()
        try {
          if(request.getString("op") == "put") put(db,owner,table,request.getJSONObject("row")) else delete(db,owner,table,request.getString("id"))
          db.setTransactionSuccessful()
        } finally { db.endTransaction() }
        JSONObject().put("committed",true)
      }
      else -> error("Unsupported ledger operation")
    }
  }
}
