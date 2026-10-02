package com.moneykai.nativecapture

/** Stable provider ordering: date alone cannot distinguish SMS received together. */
internal object MoneyKaiSmsPaging {
  data class Position(val date: Long, val id: Long) {
    fun encode(): String = "$date:$id"
    fun selection(): String = "(date < ? OR (date = ? AND _id < ?))"
    fun args(): List<String> = listOf(date.toString(), date.toString(), id.toString())
  }

  fun decode(value: String): Position? {
    val parts = value.split(":")
    if (parts.size !in 1..2) return null
    val date = parts[0].toLongOrNull()?.takeIf { it > 0 } ?: return null
    // Compatibility with old inclusive date-only cursors. New cursors always include ID.
    val id = if (parts.size == 1) Long.MAX_VALUE else parts[1].toLongOrNull()?.takeIf { it >= 0 } ?: return null
    return Position(date, id)
  }

  fun reachedLimit(scanned: Int, pageSize: Int, signals: Int, signalLimit: Int): Boolean =
    scanned >= pageSize || signals >= signalLimit
}
