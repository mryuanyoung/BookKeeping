package com.mryuanyoung.bookkeeping.calc

data class HousingFundResult(
    val theoreticalLimit: Double,
    val cityLimit: Double,
    val finalLimit: Double
)

object HousingFundCalculator {
    private val chengduLimits = arrayOf(
        doubleArrayOf(40.0, 40.0),
        doubleArrayOf(80.0, 70.0)
    )

    fun calculateChengdu(
        isCouple: Boolean,
        isFirstHouse: Boolean,
        rate: Double,
        monthlyDeposit: Double,
        months: Int
    ): HousingFundResult {
        val theoretical = rate * monthlyDeposit * (1 + months) * months / 2 / 10_000
        val cityLimit = chengduLimits[if (isCouple) 1 else 0][if (isFirstHouse) 0 else 1]
        return HousingFundResult(theoretical, cityLimit, minOf(cityLimit, theoretical))
    }
}
