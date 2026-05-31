package com.mryuanyoung.bookkeeping.data

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset

enum class BillMode { Export, Import }

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
    val unix: Long = LocalDateTime.now().toEpochSecond(ZoneOffset.ofHours(8))
) {
    val dateStr: String
        get() = "${date.year}-${date.monthValue}-${date.dayOfMonth}"

    val typeLabel: String
        get() = when (mode) {
            BillMode.Export -> ExportBillType.entries.firstOrNull { it.name == type }?.label ?: type
            BillMode.Import -> ImportBillType.entries.firstOrNull { it.name == type }?.label ?: type
        }
}

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
