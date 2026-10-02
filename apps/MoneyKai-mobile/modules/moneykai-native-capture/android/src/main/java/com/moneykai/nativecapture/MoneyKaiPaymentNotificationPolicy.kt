package com.moneykai.nativecapture

/** Pure pre-retention filter. No logging, network calls or stored original text. */
object MoneyKaiPaymentNotificationPolicy {
  private val amount = Regex("""(?:\b(?:inr|rs\.?|rupees?)\s*|₹\s*)\d""", RegexOption.IGNORE_CASE)
  private val completed = Regex("""\b(?:paid|sent|received|debited|credited|spent|withdrawn|refunded|refund received|cashback received)\b""", RegexOption.IGNORE_CASE)
  private val excluded = Regex("""\b(?:otp|one[- ]time password|verification code|pin|password|passcode|cvv|cvc|failed|unsuccessful|declined|pending|initiated|processing|scheduled|request|requested|offer|coupon|reminder|will be|once processed|not completed|not paid|could not|unable to|pay now|unlock to view|content hidden)\b""", RegexOption.IGNORE_CASE)

  fun eligible(text: String, groupSummary: Boolean = false): Boolean =
    !groupSummary && text.length <= 1000 && amount.containsMatchIn(text) &&
      completed.containsMatchIn(text) && !excluded.containsMatchIn(text)
}
