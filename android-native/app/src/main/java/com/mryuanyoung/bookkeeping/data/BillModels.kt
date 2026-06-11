package com.mryuanyoung.bookkeeping.data

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset

enum class BillMode { Export, Import }

enum class RecurringFrequency { Daily, Weekly, Monthly, Yearly }

enum class ExportBillType(val label: String) {
    Meal("餐饮"),
    Entertainment("娱乐"),
    Transportation("出行"),
    Dress("服饰"),
    Necessities("日用"),
    Rent("租房"),
    Recharge("缴费"),
    Medical("医疗")
}

enum class ImportBillType(val label: String) {
    Salary("工资"),
    Bonus("奖金"),
    Others("其他")
}

data class Bill(
    val id: Long = 0,
    val mode: BillMode,
    val amount: Double,
    val type: String,
    val remark: String,
    val date: LocalDate,
    val unix: Long = LocalDateTime.now().toEpochSecond(ZoneOffset.ofHours(8)),
    val recurringRuleId: Long? = null,
    val recurringOccurrenceDate: LocalDate? = null
) {
    val dateStr: String
        get() = "${date.year}-${date.monthValue}-${date.dayOfMonth}"

    val typeLabel: String
        get() = when (mode) {
            BillMode.Export -> ExportBillType.entries.firstOrNull { it.name == type }?.label ?: type
            BillMode.Import -> ImportBillType.entries.firstOrNull { it.name == type }?.label ?: type
        }
}

data class RecurringBillRule(
    val id: Long = 0,
    val name: String,
    val enabled: Boolean,
    val mode: BillMode,
    val amount: Double,
    val type: String,
    val remark: String,
    val frequency: RecurringFrequency,
    val intervalCount: Int = 1,
    val startDate: LocalDate,
    val endDate: LocalDate? = null,
    val dayOfMonth: Int? = null,
    val dayOfWeek: Int? = null,
    val monthOfYear: Int? = null,
    val nextRunDate: LocalDate,
    val lastRunDate: LocalDate? = null,
    val createdAt: Long = LocalDateTime.now().toEpochSecond(ZoneOffset.ofHours(8)),
    val updatedAt: Long = LocalDateTime.now().toEpochSecond(ZoneOffset.ofHours(8))
) {
    val frequencyLabel: String
        get() = when (frequency) {
            RecurringFrequency.Daily -> "每天"
            RecurringFrequency.Weekly -> "每周"
            RecurringFrequency.Monthly -> "每月"
            RecurringFrequency.Yearly -> "每年"
        }

    val typeLabel: String
        get() = when (mode) {
            BillMode.Export -> ExportBillType.entries.firstOrNull { it.name == type }?.label ?: type
            BillMode.Import -> ImportBillType.entries.firstOrNull { it.name == type }?.label ?: type
        }
}

data class RecurringBillLog(
    val id: Long = 0,
    val ruleId: Long,
    val occurrenceDate: LocalDate,
    val billId: Long,
    val createdAt: Long = LocalDateTime.now().toEpochSecond(ZoneOffset.ofHours(8))
)

data class BillSummary(
    val income: Double,
    val expense: Double,
    val count: Int
) {
    val balance: Double
        get() = income - expense
}

data class CategorySummary(
    val type: String,
    val label: String,
    val amount: Double
)
