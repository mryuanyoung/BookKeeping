package com.mryuanyoung.bookkeeping.calc

enum class PaymentType { EAPI, EAP }

data class Loan(
    val amount: Double,
    val annualRate: Double,
    val durationYears: Int
)

data class MonthlyPayment(
    val total: Double,
    val principal: Double,
    val restPrincipal: Double,
    val interest: Double
)

data class EstateInput(
    val totalPrice: Double,
    val downPaymentRate: Double,
    val loans: List<Loan>,
    val paymentType: PaymentType,
    val expectedRate: Double,
    val sellingYears: Int,
    val rent: Double
)

data class ExpectedInterest(
    val total: Double,
    val principal: Double,
    val diff: Double,
    val totalRent: Double
)

data class EstateResult(
    val accTotal: Double,
    val accInterest: Double,
    val accPrincipal: Double,
    val remainingLoan: Double,
    val expectedInterest: ExpectedInterest,
    val expectedSellingPrice: Double,
    val firstMonthPayment: Double
)

object EstateCalculator {
    fun calculate(input: EstateInput): EstateResult {
        val payments = input.loans.map { monthlyPayments(it, input.paymentType) }
        val longestTerm = input.loans.maxOfOrNull { it.durationYears }?.times(12) ?: 0
        val merged = List(longestTerm) { index ->
            MonthlyPayment(
                total = payments.sumOf { it.getOrNull(index)?.total ?: 0.0 },
                principal = payments.sumOf { it.getOrNull(index)?.principal ?: 0.0 },
                restPrincipal = payments.sumOf { it.getOrNull(index)?.restPrincipal ?: 0.0 },
                interest = payments.sumOf { it.getOrNull(index)?.interest ?: 0.0 }
            )
        }
        val sellingTerm = (input.sellingYears * 12).coerceAtMost(merged.size)
        val holdingPayments = merged.take(sellingTerm)
        val accTotal = holdingPayments.sumOf { it.total }
        val accInterest = holdingPayments.sumOf { it.interest }
        val accPrincipal = holdingPayments.sumOf { it.principal }
        val remainingLoan = holdingPayments.lastOrNull()?.restPrincipal ?: 0.0
        val expected = expectedInterest(input.totalPrice * input.downPaymentRate, merged, input.expectedRate, input.sellingYears, input.rent)
        return EstateResult(
            accTotal = accTotal,
            accInterest = accInterest,
            accPrincipal = accPrincipal,
            remainingLoan = remainingLoan,
            expectedInterest = expected,
            expectedSellingPrice = remainingLoan + expected.total,
            firstMonthPayment = merged.firstOrNull()?.total ?: 0.0
        )
    }

    private fun monthlyPayments(loan: Loan, paymentType: PaymentType): List<MonthlyPayment> =
        when (paymentType) {
            PaymentType.EAPI -> eapiPayments(loan)
            PaymentType.EAP -> eapPayments(loan)
        }

    private fun eapiPayments(loan: Loan): List<MonthlyPayment> {
        val term = loan.durationYears * 12
        val monthlyRate = loan.annualRate / 12
        val total = loan.amount * monthlyRate * Math.pow(1 + monthlyRate, term.toDouble()) /
            (Math.pow(1 + monthlyRate, term.toDouble()) - 1)
        var restPrincipal = loan.amount
        return List(term) {
            val interest = restPrincipal * monthlyRate
            val principal = total - interest
            restPrincipal -= principal
            MonthlyPayment(total, principal, restPrincipal, interest)
        }
    }

    private fun eapPayments(loan: Loan): List<MonthlyPayment> {
        val term = loan.durationYears * 12
        val monthlyRate = loan.annualRate / 12
        val principal = loan.amount / term
        var restPrincipal = loan.amount
        return List(term) {
            val interest = restPrincipal * monthlyRate
            restPrincipal -= principal
            MonthlyPayment(interest + principal, principal, restPrincipal, interest)
        }
    }

    private fun expectedInterest(
        downPayment: Double,
        monthlyPayments: List<MonthlyPayment>,
        expectedRate: Double,
        years: Int,
        rent: Double
    ): ExpectedInterest {
        var principal = downPayment
        var total = downPayment
        var curTerm = 0
        var totalRent = 0.0
        for (i in 1..years) {
            total *= 1 + expectedRate
            var monthOfYear = 0
            while (curTerm < i * 12 && curTerm < monthlyPayments.size) {
                val growingRent = rent * Math.pow(1 + 0.05 / 12, (curTerm + 1).toDouble())
                totalRent += growingRent
                val base = monthlyPayments[curTerm].total - growingRent
                principal += base
                total += base + base * expectedRate * (12 - monthOfYear) / 12
                curTerm++
                monthOfYear++
            }
        }
        return ExpectedInterest(total, principal, total - principal, totalRent)
    }
}
