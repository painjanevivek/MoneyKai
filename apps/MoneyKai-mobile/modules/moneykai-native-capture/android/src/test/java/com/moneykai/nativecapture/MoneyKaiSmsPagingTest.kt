package com.moneykai.nativecapture

import org.junit.Assert.*
import org.junit.Test

class MoneyKaiSmsPagingTest {
  @Test fun denseTransactionPageContinuesAtSignalLimit() {
    assertTrue(MoneyKaiSmsPaging.reachedLimit(100, 250, 100, 100))
    assertTrue(MoneyKaiSmsPaging.reachedLimit(250, 250, 2, 100))
    assertFalse(MoneyKaiSmsPaging.reachedLimit(99, 250, 99, 100))
  }

  @Test fun tiedTimestampsResumeUsingRowId() {
    val position = MoneyKaiSmsPaging.Position(1700000000000, 350)
    assertEquals(position, MoneyKaiSmsPaging.decode(position.encode()))
    assertEquals("(date < ? OR (date = ? AND _id < ?))", position.selection())
    assertEquals(listOf("1700000000000", "1700000000000", "350"), position.args())
    val rows = (500L downTo 1L).map { MoneyKaiSmsPaging.Position(position.date, it) }
    val pages = mutableListOf<MoneyKaiSmsPaging.Position>()
    var remaining = rows
    while (remaining.isNotEmpty()) {
      val page = remaining.take(100)
      pages.addAll(page)
      val after = MoneyKaiSmsPaging.decode(page.last().encode())!!
      remaining = rows.filter { it.date < after.date || (it.date == after.date && it.id < after.id) }
    }
    assertEquals(rows, pages)
    assertEquals(500, pages.distinct().size)
  }

  @Test fun acceptsLegacyCursorButRejectsInvalidPositions() {
    assertEquals(MoneyKaiSmsPaging.Position(123, Long.MAX_VALUE), MoneyKaiSmsPaging.decode("123"))
    listOf("", "bad", "-1:4", "123:-2", "123:bad", "123:1:2").forEach { assertNull(MoneyKaiSmsPaging.decode(it)) }
  }
}
