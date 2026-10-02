package com.moneykai.nativecapture
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
class MoneyKaiSmsScheduleTest {
  @Test fun acceptsOnlyTheSixSupportedPeriods() {
    listOf(15, 30, 60, 120, 720, 1440).forEach { assertTrue(MoneyKaiSmsSchedule.validInterval(it)) }
    listOf(-15, 0, 1, 14, 20, 1441).forEach { assertFalse(MoneyKaiSmsSchedule.validInterval(it)) }
  }
}
