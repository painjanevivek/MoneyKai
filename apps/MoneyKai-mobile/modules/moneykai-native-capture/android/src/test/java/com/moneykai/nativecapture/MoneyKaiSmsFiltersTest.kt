package com.moneykai.nativecapture

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MoneyKaiSmsFiltersTest {
  @Test
  fun importsOfficialFinancialTransactionSms() {
    assertTrue(
      MoneyKaiSmsFilters.shouldImportSms(
        sender = "AX-HDFCBK",
        body = "A/c XX4321 debited by Rs 1.00 for UPI payment to AKSHAY PAINJANE. UPI Ref 412345678901."
      )
    )
  }

  @Test
  fun rejectsNumericSenderEvenWhenBodyLooksFinancial() {
    assertFalse(
      MoneyKaiSmsFilters.shouldImportSms(
        sender = "+919876543210",
        body = "A/c XX4321 debited by Rs 999.00 for UPI payment to TEST SHOP. UPI Ref 412345678901."
      )
    )
  }

  @Test
  fun rejectsOtpChequeAndGstNoise() {
    assertFalse(MoneyKaiSmsFilters.looksLikeFinancialSms("OTP 123456 for transaction of Rs 10,000 at TEST SHOP."))
    assertFalse(MoneyKaiSmsFilters.looksLikeFinancialSms("Your A/C XX1234 has a withdrawal by Cheque of Rs 72,466.72."))
    assertFalse(MoneyKaiSmsFilters.looksLikeFinancialSms("GST invoice generated for INR 1,180.00 including CGST and SGST."))
  }

  @Test
  fun sanitizesSmsTextBeforeReturningNativeSamples() {
    val sanitized = MoneyKaiSmsFilters.sanitizeSmsText(
      "OTP 123456 for A/c XX4321 paid to user@upi. UPI Ref 412345678901 and Refno 512345678901."
    )

    assertFalse(sanitized.contains("123456"))
    assertFalse(sanitized.contains("XX4321"))
    assertFalse(sanitized.contains("user@upi"))
    assertFalse(sanitized.contains("412345678901"))
    assertFalse(sanitized.contains("512345678901"))
    assertTrue(sanitized.contains("[code]"))
    assertTrue(sanitized.contains("[masked]"))
    assertTrue(sanitized.contains("[vpa]"))
    assertTrue(sanitized.contains("UPI Ref [ref]"))
    assertTrue(sanitized.contains("Refno [ref]"))
  }

  @Test
  fun buildsStableAccountIdFromSenderAndAccountHint() {
    assertEquals(
      "sms:hdfcbk:ending4321",
      MoneyKaiSmsFilters.buildAccountId(
        sender = "AX-HDFCBK",
        body = "A/c XX4321 debited by Rs 1.00 for UPI payment to AKSHAY PAINJANE."
      )
    )
  }

  @Test
  fun formatsTimestampsAsUtcIsoStrings() {
    val iso = MoneyKaiSmsFilters.toIsoUtc(0L)

    assertNotNull(iso)
    assertEquals("1970-01-01T00:00:00.000Z", iso)
  }
}
