package com.moneykai.nativecapture

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONArray
import java.time.Instant

@RunWith(AndroidJUnit4::class)
class MoneyKaiOfflineSmsParserTest {
  private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
  @Test fun corpusMoneyAndDirectionParity() {
    val fixtures = JSONArray(context.assets.open("fixtures-v1.json").bufferedReader().use { it.readText() })
    var checked = 0
    val failures = mutableListOf<String>()
    for(index in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(index)
      val input = fixture.getJSONObject("input")
      val body = input.getString("body")
      val expected = fixture.getJSONObject("expected")
      // Android SMS support is INR financial bank alerts. Notifications use the existing TS parser.
      if(!expected.getBoolean("shouldDraft") || !MoneyKaiSmsFilters.looksLikeFinancialSms(body) || Regex("\\b(?:aed|usd|eur|gbp|sar|qar|omr|bhd|kwd)\\b",RegexOption.IGNORE_CASE).containsMatchIn(body)) continue
      val parsed = MoneyKaiOfflineSmsParser.parse(context,"AX-HDFCBK",body,Instant.parse(input.optString("receivedAt","2026-06-09T09:00:00Z")).toEpochMilli(),"$index")
      if(parsed == null || (expected.getDouble("amount")*100).toLong() != parsed.getLong("amountMinor") || expected.getString("type") != parsed.getString("type")) failures.add(fixture.getString("id"))
      checked++
    }
    assertTrue("Shared corpus must cover supported financial alerts",checked >= 10)
    assertEquals("Corpus mismatches: $failures",0,failures.size)
  }
  @Test fun strongIdentityAndSemantics() {
    val body = "A/c XX4321 debited Rs 150 to Cafe. UPI Ref 123456789012."
    fun parse(text: String,id: String) = MoneyKaiOfflineSmsParser.parse(context,"AX-HDFCBK",text,1_780_000_000_000L,id)!!
    assertEquals(parse(body,"1").getString("importIdentity"),parse(body,"2").getString("importIdentity"))
    assertNotEquals(parse(body,"1").getString("importIdentity"),parse(body.replace("4321","7654"),"1").getString("importIdentity"))
    val noRef = "A/c XX4321 debited Rs 150 for payment to Cafe."
    assertNotEquals(parse(noRef,"1").getString("importIdentity"),parse(noRef,"2").getString("importIdentity"))
    assertEquals("refund",parse("Refund Rs 150 credited to A/c XX4321.","3").getString("semantics"))
    assertEquals("reversal",parse("Reversal Rs 150 credited to A/c XX4321.","4").getString("semantics"))
    assertEquals("transfer",parse("Internal transfer Rs 150 debited from A/c XX4321.","5").getString("semantics"))
    assertNull(MoneyKaiOfflineSmsParser.parse(context,"AX-HDFCBK","OTP 123456 for Rs 150 transaction.",1L,"6"))
  }
}
