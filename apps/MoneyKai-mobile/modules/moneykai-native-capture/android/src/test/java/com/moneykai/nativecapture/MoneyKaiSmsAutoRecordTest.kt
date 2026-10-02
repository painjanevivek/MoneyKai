package com.moneykai.nativecapture

import org.junit.Assert.*
import org.junit.Test

class MoneyKaiSmsAutoRecordTest {
  private val sms = "A/c XX4321 debited by Rs 299.00 for UPI payment to Corner Cafe on 30/09/2026. UPI Ref 123456789012. Avl Bal Rs 1000."
  @Test fun validatesOriginalBeforeRedaction() {
    assertTrue(MoneyKaiSmsAutoRecord.safe(sms))
    assertFalse(MoneyKaiSmsAutoRecord.safe(MoneyKaiSmsFilters.sanitizeSmsText(sms)))
    assertEquals(64, MoneyKaiSmsAutoRecord.referenceHash(sms)!!.length)
  }
  @Test fun rejectsNonFinalOrAmbiguousOriginalText() {
    listOf("pending", "initiated", "scheduled", "failed", "refund", "cashback", "fraud", "USD 1", "another Rs 100", "and received Rs 1", "https://invalid.example").forEach {
      assertFalse(it, MoneyKaiSmsAutoRecord.safe("$sms $it"))
    }
  }
  @Test fun preservesExistingRetentionLimitAndRejectsTruncation() {
    assertFalse(MoneyKaiSmsAutoRecord.safe(sms + " ".repeat(501)))
    assertTrue(MoneyKaiSmsFilters.sanitizeSmsText("A".repeat(800)).length <= 500)
  }
  @Test fun distinguishesDifferentReferencesWithoutExposingThem() {
    assertNotEquals(MoneyKaiSmsAutoRecord.referenceHash(sms), MoneyKaiSmsAutoRecord.referenceHash(sms.replace("123456789012", "123456789013")))
    assertNull(MoneyKaiSmsAutoRecord.referenceHash("Rs 10 paid to Cafe"))
    assertNull(MoneyKaiSmsAutoRecord.referenceHash(sms.replace("123456789012", "unavailable")))
  }
  @Test fun requiresValidIndianOrInternationalMonetaryGrouping() {
    listOf("29,9.00", "299.001", "299,", "2,9,9").forEach { assertFalse(MoneyKaiSmsAutoRecord.safe(sms.replace("299.00", it))) }
    listOf("2,999.00", "1,00,299.00", "100299.00").forEach { assertTrue(MoneyKaiSmsAutoRecord.safe(sms.replace("299.00", it))) }
  }
}
