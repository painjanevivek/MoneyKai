package com.moneykai.nativecapture

import android.content.Context

/** One encrypted, no-backup namespace for the device-only research activity. */
object MoneyKaiSmsLabStorage {
  private const val NAME = "moneykai-sms-lab-v1"
  fun read(context: Context): String? = MoneyKaiPrivateStorage.get(context, NAME)
  fun write(context: Context, value: String) {
    require(value.toByteArray(Charsets.UTF_8).size <= 4 * 1024 * 1024)
    MoneyKaiPrivateStorage.set(context, NAME, value)
  }
  /** Synthetic round-trip only; never reads or changes review records. */
  fun selfTest(context: Context): Boolean {
    val name = "moneykai-sms-lab-selftest-v1"
    return try {
      MoneyKaiPrivateStorage.set(context, name, "synthetic-no-user-data")
      MoneyKaiPrivateStorage.get(context, name) == "synthetic-no-user-data"
    } finally { MoneyKaiPrivateStorage.remove(context, name) }
  }
}
