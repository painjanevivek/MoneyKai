package com.moneykai.nativecapture

import android.content.Context
import org.json.JSONObject
import java.text.Normalizer
import java.util.Locale
import kotlin.math.ln

/** Same bundled local weights and abstention rules as the TypeScript category model. */
internal object MoneyKaiOfflineCategoryModel {
  private data class Prepared(val labels:List<String>,val weights:Map<String,DoubleArray>,val anchors:Map<String,Regex>)
  @Volatile private var prepared:Prepared?=null
  private val tokenPattern=Regex("[\\p{L}\\p{M}\\p{N}]+")
  private val ambiguous=Regex("\\b(?:instamart|blinkit|zepto|big\\s*basket|wellness|spa|gift|transfer)\\b",RegexOption.IGNORE_CASE)
  @Synchronized private fun load(context:Context):Prepared {
    prepared?.let{return it}
    val model=JSONObject(context.assets.open("categoryModelV2.json").bufferedReader().use{it.readText()})
    val config=JSONObject(context.assets.open("category-anchors-v1.json").bufferedReader().use{it.readText()})
    val labels = model.getJSONArray("labels").let { (0 until it.length()).map { index -> it.getString(index) } }
    val vocabulary = model.getJSONArray("vocabulary").let { (0 until it.length()).map { index -> it.getString(index) }.toSet() }
    val generic = config.getJSONArray("genericTokens").let { (0 until it.length()).map { index -> it.getString(index) }.toSet() }
    val counts = model.getJSONObject("counts"); val totals = model.getJSONObject("totals")
    val anchors = config.getJSONObject("anchors").let { objectValue -> objectValue.keys().asSequence().associateWith { Regex(objectValue.getString(it),RegexOption.IGNORE_CASE) } }
    val weights=mutableMapOf<String,DoubleArray>()
    for(token in vocabulary) {
      val frequencies = labels.map { counts.getJSONObject(it).optInt(token) }.sortedDescending()
      if(token in generic || (frequencies[1]>0 && (frequencies[0]+1).toDouble()/(frequencies[1]+1)<3))continue
      val boost=if(anchors.values.any{it.containsMatchIn(token)})2 else 1
      weights[token]=DoubleArray(labels.size){index->val label=labels[index];boost*ln((counts.getJSONObject(label).optInt(token)+1).toDouble()/(totals.getInt(label)+vocabulary.size))}
    }
    return Prepared(labels,weights,anchors).also{prepared=it}
  }
  fun classify(context:Context,text:String):Pair<String?,Boolean> {
    val model=prepared ?: load(context)
    val tokens=tokenPattern.findAll(Normalizer.normalize(text,Normalizer.Form.NFC).lowercase(Locale.US)).map{it.value}.distinct().mapNotNull{model.weights[it]}.toList()
    if(tokens.isEmpty()) return null to false
    val scores=DoubleArray(model.labels.size)
    for(weights in tokens)for(index in scores.indices)scores[index]+=weights[index]
    val best=scores.indices.sortedByDescending{scores[it]}
    val category=if(scores[best[0]]-scores[best[1]]>=ln(1.5))model.labels[best[0]] else null
    val matches=model.anchors.filterValues{it.containsMatchIn(text)}.keys
    return category to (category!=null && !ambiguous.containsMatchIn(text) && matches.singleOrNull()==category)
  }
}
