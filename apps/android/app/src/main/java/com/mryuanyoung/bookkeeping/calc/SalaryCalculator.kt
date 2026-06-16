package com.mryuanyoung.bookkeeping.calc

data class SalaryInput(
    val base: Double,
    val monthlySubsidy: Double,
    val yearAward: Double,
    val extraAward: Double,
    val insuranceBase: Double,
    val fundRatePercent: Double,
    val fundLimitBase: Double,
    val specialDeduction: Double = 1500.0
)

data class SalaryResult(
    val beforeTaxYearSalary: Double,
    val fiveInsurancesPerMonth: Double,
    val fundPerMonth: Double,
    val totalTax: Double,
    val afterTaxYearSalary: Double
)

object SalaryCalculator {
    private val insuranceRates = listOf(0.08, 0.02, 0.01, 0.0, 0.0)
    private val taxLevel = listOf(0.0, 36_000.0, 144_000.0, 300_000.0, 420_000.0, 660_000.0, 960_000.0)
    private val taxTable = listOf(
        0.03 to 0.0,
        0.10 to 2_520.0,
        0.20 to 16_920.0,
        0.25 to 31_920.0,
        0.30 to 52_920.0,
        0.35 to 85_920.0,
        0.45 to 181_920.0
    )

    fun calculate(input: SalaryInput): SalaryResult {
        val beforeTax = (input.base + input.monthlySubsidy) * 12 + input.yearAward + input.extraAward
        val fiveInsurances = input.insuranceBase * insuranceRates.sum()
        val fund = minOf(input.fundRatePercent / 100 * input.insuranceBase, input.fundLimitBase * 3 * 0.12)
        val taxBase = beforeTax - 5000 * 12 - (fiveInsurances + fund) * 12 - input.specialDeduction * 12
        val level = taxLevel.indexOfLast { taxBase >= it }.coerceIn(0, taxTable.lastIndex)
        val (rate, quickDeduction) = taxTable[level]
        val totalTax = maxOf(0.0, taxBase * rate - quickDeduction)
        val afterTax = beforeTax - totalTax - fiveInsurances * 12 + fund * 12
        return SalaryResult(beforeTax, fiveInsurances, fund, totalTax, afterTax)
    }
}
