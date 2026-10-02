package com.moneykai.nativecapture

import android.content.Context
import org.json.JSONObject
import java.text.Normalizer
import java.util.Locale
import kotlin.math.ln

/** Same bundled local weights and abstention rules as the TypeScript category model. */
internal object MoneyKaiOfflineCategoryModel {
  private var model: JSONObject? = null
  private var config: JSONObject? = null
  fun classify(context: Context, text: String): Pair<String?,Boolean> {
    if(model == null) model = JSONObject(context.assets.open("categoryModelV2.json").bufferedReader().use { it.readText() })
    if(config == null) config = JSONObject(context.assets.open("category-anchors-v1.json").bufferedReader().use { it.readText() })
    val model = model!!; val config = config!!
    val labels = model.getJSONArray("labels").let { (0 until it.length()).map { index -> it.getString(index) } }
    val vocabulary = model.getJSONArray("vocabulary").let { (0 until it.length()).map { index -> it.getString(index) }.toSet() }
    val generic = config.getJSONArray("genericTokens").let { (0 until it.length()).map { index -> it.getString(index) }.toSet() }
    val counts = model.getJSONObject("counts"); val totals = model.getJSONObject("totals")
    val anchors = config.getJSONObject("anchors").let { objectValue -> objectValue.keys().asSequence().associateWith { Regex(objectValue.getString(it),RegexOption.IGNORE_CASE) } }
    val tokens = Regex("[\\p{L}\\p{M}\\p{N}]+").findAll(Normalizer.normalize(text,Normalizer.Form.NFC).lowercase(Locale.US)).map { it.value }.distinct().filter { token ->
      val frequencies = labels.map { counts.getJSONObject(it).optInt(token) }.sortedDescending()
      token in vocabulary && token !in generic && (frequencies[1] == 0 || (frequencies[0]+1).toDouble()/(frequencies[1]+1) >= 3)
    }.toList()
    if(tokens.isEmpty()) return null to false
    val scores = labels.map { label -> label to tokens.sumOf { token -> (if(anchors.values.any { it.containsMatchIn(token) }) 2 else 1)*ln((counts.getJSONObject(label).optInt(token)+1).toDouble()/(totals.getInt(label)+vocabulary.size)) } }.sortedByDescending { it.second }
    val category = if(scores[0].second-scores[1].second >= ln(1.5)) scores[0].first else null
    val matches = anchors.filterValues { it.containsMatchIn(text) }.keys
    val ambiguous = Regex("\\b(?:instamart|blinkit|zepto|big\\s*basket|wellness|spa|gift|transfer)\\b",RegexOption.IGNORE_CASE).containsMatchIn(text)
    return category to (category != null && !ambiguous && matches.singleOrNull() == category)
  }
}
