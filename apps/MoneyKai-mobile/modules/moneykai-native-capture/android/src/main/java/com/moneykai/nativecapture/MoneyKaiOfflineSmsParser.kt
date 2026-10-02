package com.moneykai.nativecapture

import android.content.Context
import org.json.JSONObject
import java.math.BigDecimal
import java.security.MessageDigest
import java.util.Locale
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/** Portable versioned rules; original text exists only during the current batch. */
internal object MoneyKaiOfflineSmsParser {
  private var rules: JSONObject? = null
  private val patterns = mutableMapOf<String,Regex>()
  fun load(context: Context): JSONObject {
    rules?.let { return it }
    return JSONObject(context.assets.open("offline-v1.json").bufferedReader().use { it.readText() }).also {
      rules = it
      for(name in listOf("amount","bareAmount","debit","credit","ignore","merchant","currencies","refund","reversal","transfer")) patterns[name] = Regex(it.getString(name),RegexOption.IGNORE_CASE)
    }
  }
  fun digest(value: String) = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }
  fun messageIdentity(sender: String, body: String, date: Long, id: String) = digest("message|${sender.lowercase(Locale.US)}|$date|$id|${digest(body)}")
  fun parse(context: Context, sender: String, body: String, date: Long, id: String): JSONObject? {
    val config = load(context)
    if(!MoneyKaiSmsFilters.looksLikeOfficialTransactionSender(sender) || patterns.getValue("ignore").containsMatchIn(body)) return null
    // Foreign-currency SMS are never silently interpreted as INR transactions.
    if(patterns.getValue("currencies").containsMatchIn(body)) return null
    val candidates = patterns.getValue("amount").findAll(body).filter { match ->
      !Regex("""\b(?:bal(?:ance)?|limit)\.?\s*(?:(?:is|of)\s*)?[:=-]?\s*$""",RegexOption.IGNORE_CASE).containsMatchIn(body.substring(maxOf(0,match.range.first-70),match.range.first))
    }.toList().ifEmpty { patterns.getValue("bareAmount").findAll(body).toList() }
    val match = candidates.firstOrNull() ?: return null
    val raw = match.groupValues[1]
    if(!Regex("""^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$""").matches(raw)) return null
    val amount = try { BigDecimal(raw.replace(",","")).movePointRight(2).longValueExact() } catch(_: ArithmeticException) { return null }
    if(amount <= 0 || amount > 100_000_000_000_000L) return null
    val debit = patterns.getValue("debit").containsMatchIn(body)
    val credit = patterns.getValue("credit").containsMatchIn(body)
    val semantics = when {
      patterns.getValue("reversal").containsMatchIn(body) -> "reversal"
      patterns.getValue("refund").containsMatchIn(body) -> "refund"
      patterns.getValue("transfer").containsMatchIn(body) -> "transfer"
      else -> "payment"
    }
    if(!debit && !credit) return null
    val direction = if(credit && (!debit || semantics in listOf("refund","reversal"))) "income" else "expense"
    val merchant = patterns.getValue("merchant").find(body)?.groupValues?.get(1)?.trim()
      ?: Regex("""\bupi/p2[am]/[a-z0-9-]{6,}/([^.;]+)""",RegexOption.IGNORE_CASE).find(body)?.groupValues?.get(1)?.trim()
      ?: if(semantics in listOf("refund","reversal")) semantics.replaceFirstChar { it.uppercase() } else "Unknown counterparty"
    val safeMerchant = MoneyKaiSmsFilters.sanitizeSmsText(merchant).take(120)
    val account = MoneyKaiSmsFilters.buildAccountId(sender,body) ?: return null
    val accountIdentity = digest(account)
    val reference = MoneyKaiSmsAutoRecord.referenceHash(body)
    val messageIdentity = messageIdentity(sender,body,date,id)
    val identity = digest(if(reference != null) "reference|$accountIdentity|INR|$amount|$direction|$semantics|$reference" else messageIdentity)
    val method = when { Regex("\\bupi\\b",RegexOption.IGNORE_CASE).containsMatchIn(body) -> "upi"; Regex("\\bcard|pos\\b",RegexOption.IGNORE_CASE).containsMatchIn(body) -> "card"; Regex("\\bwallet\\b",RegexOption.IGNORE_CASE).containsMatchIn(body) -> "wallet"; else -> "bank" }
    var day = MoneyKaiSmsFilters.toIsoUtc(date).take(10)
    val dateMatch = Regex("""\b(\d{4}-\d{2}-\d{2}|\d{2}[-/]\d{2}[-/]\d{4}|\d{2}-[A-Za-z]{3}(?:-\d{2,4})?)\b""").find(body)?.value
    if(dateMatch != null) {
      for(format in listOf("yyyy-MM-dd","dd/MM/uuuu","dd-MM-uuuu","dd-MMM-uuuu","dd-MMM-yy","dd-MMM")) {
        try {
          val text = if(format == "dd-MMM") "$dateMatch-${day.take(4)}" else dateMatch
          val effective = if(format == "dd-MMM") "dd-MMM-uuuu" else format
          day = LocalDate.parse(text,DateTimeFormatter.ofPattern(effective,Locale.US)).toString(); break
        } catch(_: Exception) { }
      }
    }
    return JSONObject().put("id","sms_$identity").put("signalId",messageIdentity).put("importIdentity",identity)
      .put("accountIdentity",accountIdentity).put("captureAccountId",account).put("captureSource","sms")
      .put("parserVersion",config.getString("version")).put("amountMinor",amount).put("amount",BigDecimal.valueOf(amount,2))
      .put("currency","INR").put("type",direction).put("semantics",semantics).put("transaction_date",day)
      .put("description",safeMerchant).put("counterpartyName",safeMerchant).put("payment_method",method)
      .put("category",if(semantics in listOf("refund","reversal")) "refund" else if(direction == "income") "other_income" else "others")
      .put("status","pending").put("reviewStatus","pending").put("syncStatus","local_only").put("confidence",if(candidates.size == 1 && debit != credit && reference != null) 0.8 else 0.5)
      .put("reviewRequired",true).put("ambiguous",candidates.size != 1 || debit == credit || Regex("\\binitiated|once processed|will be credited\\b",RegexOption.IGNORE_CASE).containsMatchIn(body)).put("strongIdentity",reference != null)
      .put("createdAt",MoneyKaiSmsFilters.toIsoUtc(System.currentTimeMillis())).put("created_at",MoneyKaiSmsFilters.toIsoUtc(System.currentTimeMillis()))
  }
}
