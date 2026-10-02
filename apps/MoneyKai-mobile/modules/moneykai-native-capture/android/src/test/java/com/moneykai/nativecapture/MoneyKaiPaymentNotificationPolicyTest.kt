package com.moneykai.nativecapture

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MoneyKaiPaymentNotificationPolicyTest {
  @Test fun completedPayments() {
    listOf("You paid ₹450 to Corner Cafe", "Received INR 800 from Arun Kumar", "Rs. 25 credited as cashback received").forEach {
      assertTrue(MoneyKaiPaymentNotificationPolicy.eligible(it))
    }
  }
  @Test fun rejectsNonTransactionsBeforeRetention() {
    listOf("OTP 123456 for payment of Rs 450", "You paid ₹450, payment failed", "Payment pending: paid Rs 100", "Arun requested ₹800", "Get cashback offer ₹200", "PIN changed, paid ₹100", "You will be credited INR 100", "Paid ₹500 processing", "You have 3 transactions", "Paid ₹100 content hidden").forEach {
      assertFalse(MoneyKaiPaymentNotificationPolicy.eligible(it))
    }
    assertFalse(MoneyKaiPaymentNotificationPolicy.eligible("Paid Rs 100", true))
    assertFalse(MoneyKaiPaymentNotificationPolicy.eligible("Paid Rs 100 " + "x".repeat(1000)))
  }
}
