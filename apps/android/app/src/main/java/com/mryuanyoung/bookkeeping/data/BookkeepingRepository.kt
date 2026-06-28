package com.mryuanyoung.bookkeeping.data

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.YearMonth
import kotlin.math.min

class BookkeepingRepository(context: Context) :
    SQLiteOpenHelper(context, "bookkeeping.db", null, 2) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mode TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                remark TEXT NOT NULL,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                day INTEGER NOT NULL,
                dateStr TEXT NOT NULL,
                unix INTEGER NOT NULL,
                recurringRuleId INTEGER,
                recurringOccurrenceDate TEXT
            )
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX idx_bills_date ON bills(year, month, day)")
        db.execSQL("CREATE INDEX idx_bills_mode_date ON bills(mode, dateStr)")
        db.execSQL("CREATE INDEX idx_bills_recurring ON bills(recurringRuleId, recurringOccurrenceDate)")
        createRecurringTables(db)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            addColumnIfMissing(db, "bills", "recurringRuleId", "INTEGER")
            addColumnIfMissing(db, "bills", "recurringOccurrenceDate", "TEXT")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_bills_recurring ON bills(recurringRuleId, recurringOccurrenceDate)")
            createRecurringTables(db)
        }
    }

    fun create(bill: Bill): Long = insertBill(writableDatabase, bill)

    fun update(bill: Bill) {
        writableDatabase.update("bills", bill.valuesWithoutId(), "id = ?", arrayOf(bill.id.toString()))
    }

    fun delete(id: Long) {
        writableDatabase.delete("bills", "id = ?", arrayOf(id.toString()))
    }

    fun findByDay(date: LocalDate): List<Bill> =
        query("year = ? AND month = ? AND day = ?", date.args())

    fun findByMonth(year: Int, month: Int): List<Bill> =
        query("year = ? AND month = ?", arrayOf(year.toString(), month.toString()))

    fun findByYear(year: Int): List<Bill> =
        query("year = ?", arrayOf(year.toString()))

    fun findAll(): List<Bill> = query(null, emptyArray())

    fun findRecent(limit: Int): List<Bill> =
        query(null, emptyArray(), limit)

    fun findRecentByYear(year: Int, limit: Int): List<Bill> =
        query("year = ?", arrayOf(year.toString()), limit)

    fun searchBills(
        keyword: String,
        startDate: LocalDate?,
        endDate: LocalDate?,
        mode: BillMode?,
        minAmount: Double?,
        maxAmount: Double?
    ): List<Bill> {
        val where = mutableListOf<String>()
        val args = mutableListOf<String>()

        if (startDate != null || endDate != null) {
            val from = when {
                startDate == null -> null
                endDate != null && startDate.isAfter(endDate) -> endDate
                else -> startDate
            }
            val to = when {
                endDate == null -> null
                startDate != null && startDate.isAfter(endDate) -> startDate
                else -> endDate
            }

            if (from != null) {
                where.add("((year > ?) OR (year = ? AND month > ?) OR (year = ? AND month = ? AND day >= ?))")
                args.addAll(
                    listOf(
                        from.year.toString(),
                        from.year.toString(),
                        from.monthValue.toString(),
                        from.year.toString(),
                        from.monthValue.toString(),
                        from.dayOfMonth.toString()
                    )
                )
            }
            if (to != null) {
                where.add("((year < ?) OR (year = ? AND month < ?) OR (year = ? AND month = ? AND day <= ?))")
                args.addAll(
                    listOf(
                        to.year.toString(),
                        to.year.toString(),
                        to.monthValue.toString(),
                        to.year.toString(),
                        to.monthValue.toString(),
                        to.dayOfMonth.toString()
                    )
                )
            }
        }

        if (mode != null) {
            where.add("mode = ?")
            args.add(mode.name)
        }
        keyword.trim().takeIf { it.isNotBlank() }?.let {
            where.add("remark LIKE ? ESCAPE '\\'")
            args.add("%${it.escapeLike()}%")
        }
        if (minAmount != null) {
            where.add("amount >= ?")
            args.add(minAmount.toString())
        }
        if (maxAmount != null) {
            where.add("amount <= ?")
            args.add(maxAmount.toString())
        }

        return query(where.takeIf { it.isNotEmpty() }?.joinToString(" AND "), args.toTypedArray())
    }

    fun availableYears(): List<Int> {
        val cursor = readableDatabase.rawQuery("SELECT DISTINCT year FROM bills ORDER BY year DESC", null)
        cursor.use {
            val years = mutableListOf<Int>()
            while (it.moveToNext()) years.add(it.getInt(0))
            return years
        }
    }

    fun createRecurringRule(rule: RecurringBillRule): Long =
        writableDatabase.insert("recurring_bill_rules", null, rule.valuesWithoutId())

    fun updateRecurringRule(rule: RecurringBillRule) {
        writableDatabase.update(
            "recurring_bill_rules",
            rule.valuesWithoutId(),
            "id = ?",
            arrayOf(rule.id.toString())
        )
    }

    fun deleteRecurringRule(id: Long) {
        writableDatabase.beginTransaction()
        try {
            writableDatabase.delete("recurring_bill_rules", "id = ?", arrayOf(id.toString()))
            writableDatabase.delete("recurring_bill_logs", "ruleId = ?", arrayOf(id.toString()))
            writableDatabase.setTransactionSuccessful()
        } finally {
            writableDatabase.endTransaction()
        }
    }

    fun setRecurringRuleEnabled(id: Long, enabled: Boolean) {
        writableDatabase.update(
            "recurring_bill_rules",
            ContentValues().apply {
                put("enabled", if (enabled) 1 else 0)
                put("updatedAt", nowSeconds())
            },
            "id = ?",
            arrayOf(id.toString())
        )
    }

    fun findRecurringRules(): List<RecurringBillRule> {
        val cursor = readableDatabase.query(
            "recurring_bill_rules",
            null,
            null,
            emptyArray(),
            null,
            null,
            "enabled DESC, nextRunDate ASC, id DESC"
        )
        cursor.use {
            val result = mutableListOf<RecurringBillRule>()
            while (it.moveToNext()) result.add(it.toRecurringRule())
            return result
        }
    }

    fun generateDueRecurringBills(today: LocalDate = LocalDate.now()): Int {
        val rules = findDueRecurringRules(today)
        if (rules.isEmpty()) return 0

        var generated = 0
        val db = writableDatabase
        db.beginTransaction()
        try {
            rules.forEach { rule ->
                var occurrence = rule.nextRunDate
                var lastRun = rule.lastRunDate
                while (!occurrence.isAfter(today) && (rule.endDate == null || !occurrence.isAfter(rule.endDate))) {
                    if (!recurringLogExists(db, rule.id, occurrence)) {
                        val billId = insertBill(
                            db,
                            Bill(
                                mode = rule.mode,
                                amount = rule.amount,
                                type = rule.type,
                                remark = rule.remark,
                                date = occurrence,
                                recurringRuleId = rule.id,
                                recurringOccurrenceDate = occurrence
                            )
                        )
                        db.insert(
                            "recurring_bill_logs",
                            null,
                            RecurringBillLog(
                                ruleId = rule.id,
                                occurrenceDate = occurrence,
                                billId = billId
                            ).valuesWithoutId()
                        )
                        generated++
                    }
                    lastRun = occurrence
                    occurrence = nextOccurrenceAfter(rule, occurrence)
                }
                db.update(
                    "recurring_bill_rules",
                    ContentValues().apply {
                        put("nextRunDate", occurrence.toString())
                        if (lastRun != null) put("lastRunDate", lastRun.toString())
                        put("updatedAt", nowSeconds())
                    },
                    "id = ?",
                    arrayOf(rule.id.toString())
                )
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        return generated
    }

    fun nextRecurringDate(
        frequency: RecurringFrequency,
        intervalCount: Int,
        startDate: LocalDate,
        dayOfMonth: Int?,
        dayOfWeek: Int?,
        monthOfYear: Int?
    ): LocalDate {
        val interval = intervalCount.coerceAtLeast(1)
        return when (frequency) {
            RecurringFrequency.Daily -> startDate
            RecurringFrequency.Weekly -> {
                val targetDay = (dayOfWeek ?: startDate.dayOfWeek.value).coerceIn(1, 7)
                var candidate = startDate.plusDays(((targetDay - startDate.dayOfWeek.value + 7) % 7).toLong())
                while (candidate.isBefore(startDate)) candidate = candidate.plusWeeks(interval.toLong())
                candidate
            }
            RecurringFrequency.Monthly -> {
                val day = (dayOfMonth ?: startDate.dayOfMonth).coerceIn(1, 31)
                var month = YearMonth.from(startDate)
                var candidate = month.atDay(min(day, month.lengthOfMonth()))
                while (candidate.isBefore(startDate)) {
                    month = month.plusMonths(interval.toLong())
                    candidate = month.atDay(min(day, month.lengthOfMonth()))
                }
                candidate
            }
            RecurringFrequency.Yearly -> {
                val monthValue = (monthOfYear ?: startDate.monthValue).coerceIn(1, 12)
                val day = (dayOfMonth ?: startDate.dayOfMonth).coerceIn(1, 31)
                var year = startDate.year
                var yearMonth = YearMonth.of(year, monthValue)
                var candidate = yearMonth.atDay(min(day, yearMonth.lengthOfMonth()))
                while (candidate.isBefore(startDate)) {
                    year += interval
                    yearMonth = YearMonth.of(year, monthValue)
                    candidate = yearMonth.atDay(min(day, yearMonth.lengthOfMonth()))
                }
                candidate
            }
        }
    }

    fun monthlySummary(year: Int): List<Pair<Int, BillSummary>> {
        val grouped = groupedSummary("month", "year = ?", arrayOf(year.toString()))
        return (1..12).map { month -> month to (grouped[month] ?: BillSummary(0.0, 0.0, 0)) }
    }

    fun dailySummary(year: Int, month: Int): List<Pair<Int, BillSummary>> {
        val days = java.time.YearMonth.of(year, month).lengthOfMonth()
        val grouped = groupedSummary("day", "year = ? AND month = ?", arrayOf(year.toString(), month.toString()))
        return (1..days).map { day -> day to (grouped[day] ?: BillSummary(0.0, 0.0, 0)) }
    }

    fun daySummary(date: LocalDate): BillSummary = summary("year = ? AND month = ? AND day = ?", date.args())

    fun monthSummary(year: Int, month: Int): BillSummary =
        summary("year = ? AND month = ?", arrayOf(year.toString(), month.toString()))

    fun yearSummary(year: Int): BillSummary = summary("year = ?", arrayOf(year.toString()))

    fun allSummary(): BillSummary = summary(null, emptyArray())

    fun categorySummaryByDay(date: LocalDate, mode: BillMode): List<CategorySummary> =
        categorySummary("year = ? AND month = ? AND day = ?", date.args(), mode)

    fun categorySummaryByMonth(year: Int, month: Int, mode: BillMode): List<CategorySummary> =
        categorySummary("year = ? AND month = ?", arrayOf(year.toString(), month.toString()), mode)

    fun categorySummaryByYear(year: Int, mode: BillMode): List<CategorySummary> =
        categorySummary("year = ?", arrayOf(year.toString()), mode)

    fun categorySummaryAll(mode: BillMode): List<CategorySummary> =
        categorySummary(null, emptyArray(), mode)

    fun yearlySummary(): List<Pair<Int, BillSummary>> {
        val grouped = groupedSummary("year", null, emptyArray())
        return grouped.keys.sorted().map { year -> year to grouped.getValue(year) }
    }

    fun summary(bills: List<Bill>): BillSummary {
        val income = bills.filter { it.mode == BillMode.Import }.sumOf { it.amount }
        val expense = bills.filter { it.mode == BillMode.Export }.sumOf { it.amount }
        return BillSummary(income, expense, bills.size)
    }

    fun categorySummary(bills: List<Bill>, mode: BillMode): List<CategorySummary> =
        bills.filter { it.mode == mode }
            .groupBy { it.type }
            .map { (type, values) ->
                CategorySummary(type, values.first().typeLabel, values.sumOf { it.amount })
            }
            .sortedByDescending { it.amount }

    private fun summary(where: String?, args: Array<String>): BillSummary {
        val sql = buildString {
            append("SELECT ")
            append("COALESCE(SUM(CASE WHEN mode = 'Import' THEN amount ELSE 0 END), 0), ")
            append("COALESCE(SUM(CASE WHEN mode = 'Export' THEN amount ELSE 0 END), 0), ")
            append("COUNT(*) FROM bills")
            if (where != null) append(" WHERE ").append(where)
        }
        readableDatabase.rawQuery(sql, args).use { cursor ->
            if (!cursor.moveToFirst()) return BillSummary(0.0, 0.0, 0)
            return BillSummary(cursor.getDouble(0), cursor.getDouble(1), cursor.getInt(2))
        }
    }

    private fun groupedSummary(groupColumn: String, where: String?, args: Array<String>): Map<Int, BillSummary> {
        val sql = buildString {
            append("SELECT ").append(groupColumn).append(", ")
            append("COALESCE(SUM(CASE WHEN mode = 'Import' THEN amount ELSE 0 END), 0), ")
            append("COALESCE(SUM(CASE WHEN mode = 'Export' THEN amount ELSE 0 END), 0), ")
            append("COUNT(*) FROM bills")
            if (where != null) append(" WHERE ").append(where)
            append(" GROUP BY ").append(groupColumn)
            append(" ORDER BY ").append(groupColumn)
        }
        readableDatabase.rawQuery(sql, args).use { cursor ->
            val result = mutableMapOf<Int, BillSummary>()
            while (cursor.moveToNext()) {
                result[cursor.getInt(0)] = BillSummary(cursor.getDouble(1), cursor.getDouble(2), cursor.getInt(3))
            }
            return result
        }
    }

    private fun categorySummary(where: String?, args: Array<String>, mode: BillMode): List<CategorySummary> {
        val sql = buildString {
            append("SELECT type, COALESCE(SUM(amount), 0) FROM bills WHERE mode = ?")
            if (where != null) append(" AND ").append(where)
            append(" GROUP BY type ORDER BY COALESCE(SUM(amount), 0) DESC")
        }
        val sqlArgs = arrayOf(mode.name, *args)
        readableDatabase.rawQuery(sql, sqlArgs).use { cursor ->
            val result = mutableListOf<CategorySummary>()
            while (cursor.moveToNext()) {
                val type = cursor.getString(0)
                val label = when (mode) {
                    BillMode.Export -> ExportBillType.entries.firstOrNull { it.name == type }?.label ?: type
                    BillMode.Import -> ImportBillType.entries.firstOrNull { it.name == type }?.label ?: type
                }
                result.add(CategorySummary(type, label, cursor.getDouble(1)))
            }
            return result
        }
    }

    fun exportJson(): String {
        val all = findAll()
        val importBill = JSONArray()
        val exportBill = JSONArray()
        all.forEach { bill ->
            if (bill.mode == BillMode.Import) importBill.put(bill.toWebJson()) else exportBill.put(bill.toWebJson())
        }
        return JSONObject()
            .put("importBill", importBill)
            .put("exportBill", exportBill)
            .put("recurringBillRules", JSONArray().apply { findRecurringRules().forEach { put(it.toJson()) } })
            .put("recurringBillLogs", JSONArray().apply { findRecurringLogs().forEach { put(it.toJson()) } })
            .toString(2)
    }

    fun importJson(text: String) {
        val root = JSONObject(text)
        val bills = mutableListOf<Bill>()
        val rules = mutableListOf<RecurringBillRule>()
        val logs = mutableListOf<RecurringBillLog>()
        root.optJSONArray("importBill")?.let { arr ->
            for (i in 0 until arr.length()) bills.add(arr.getJSONObject(i).toBill(BillMode.Import))
        }
        root.optJSONArray("exportBill")?.let { arr ->
            for (i in 0 until arr.length()) bills.add(arr.getJSONObject(i).toBill(BillMode.Export))
        }
        root.optJSONArray("recurringBillRules")?.let { arr ->
            for (i in 0 until arr.length()) rules.add(arr.getJSONObject(i).toRecurringRule())
        }
        root.optJSONArray("recurringBillLogs")?.let { arr ->
            for (i in 0 until arr.length()) logs.add(arr.getJSONObject(i).toRecurringLog())
        }

        writableDatabase.beginTransaction()
        try {
            writableDatabase.delete("bills", null, null)
            writableDatabase.delete("recurring_bill_logs", null, null)
            writableDatabase.delete("recurring_bill_rules", null, null)
            bills.forEach { writableDatabase.insert("bills", null, it.valuesWithoutId()) }
            rules.forEach { writableDatabase.insert("recurring_bill_rules", null, it.valuesWithId()) }
            logs.forEach { writableDatabase.insert("recurring_bill_logs", null, it.valuesWithId()) }
            writableDatabase.setTransactionSuccessful()
        } finally {
            writableDatabase.endTransaction()
        }
    }

    private fun findDueRecurringRules(today: LocalDate): List<RecurringBillRule> {
        val cursor = readableDatabase.query(
            "recurring_bill_rules",
            null,
            "enabled = 1 AND nextRunDate <= ?",
            arrayOf(today.toString()),
            null,
            null,
            "nextRunDate ASC"
        )
        cursor.use {
            val result = mutableListOf<RecurringBillRule>()
            while (it.moveToNext()) result.add(it.toRecurringRule())
            return result
        }
    }

    private fun findRecurringLogs(): List<RecurringBillLog> {
        val cursor = readableDatabase.query(
            "recurring_bill_logs",
            null,
            null,
            emptyArray(),
            null,
            null,
            "createdAt ASC"
        )
        cursor.use {
            val result = mutableListOf<RecurringBillLog>()
            while (it.moveToNext()) result.add(it.toRecurringLog())
            return result
        }
    }

    private fun query(where: String?, args: Array<String>, limit: Int? = null): List<Bill> {
        val cursor = readableDatabase.query(
            "bills",
            null,
            where,
            args,
            null,
            null,
            "year DESC, month DESC, day DESC, unix DESC",
            limit?.toString()
        )
        cursor.use {
            val result = mutableListOf<Bill>()
            while (it.moveToNext()) result.add(it.toBill())
            return result
        }
    }

    private fun String.escapeLike(): String =
        replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")

    private fun createRecurringTables(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS recurring_bill_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                enabled INTEGER NOT NULL,
                mode TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                remark TEXT NOT NULL,
                frequency TEXT NOT NULL,
                intervalCount INTEGER NOT NULL,
                startDate TEXT NOT NULL,
                endDate TEXT,
                dayOfMonth INTEGER,
                dayOfWeek INTEGER,
                monthOfYear INTEGER,
                nextRunDate TEXT NOT NULL,
                lastRunDate TEXT,
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL
            )
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS recurring_bill_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ruleId INTEGER NOT NULL,
                occurrenceDate TEXT NOT NULL,
                billId INTEGER NOT NULL,
                createdAt INTEGER NOT NULL,
                UNIQUE(ruleId, occurrenceDate)
            )
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_recurring_rules_due ON recurring_bill_rules(enabled, nextRunDate)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_recurring_logs_rule ON recurring_bill_logs(ruleId, occurrenceDate)")
    }

    private fun addColumnIfMissing(db: SQLiteDatabase, table: String, column: String, type: String) {
        db.rawQuery("PRAGMA table_info($table)", null).use { cursor ->
            while (cursor.moveToNext()) {
                if (cursor.getString(cursor.getColumnIndexOrThrow("name")) == column) return
            }
        }
        db.execSQL("ALTER TABLE $table ADD COLUMN $column $type")
    }

    private fun insertBill(db: SQLiteDatabase, bill: Bill): Long =
        db.insert("bills", null, bill.valuesWithoutId())

    private fun recurringLogExists(db: SQLiteDatabase, ruleId: Long, occurrenceDate: LocalDate): Boolean {
        db.query(
            "recurring_bill_logs",
            arrayOf("id"),
            "ruleId = ? AND occurrenceDate = ?",
            arrayOf(ruleId.toString(), occurrenceDate.toString()),
            null,
            null,
            null,
            "1"
        ).use { return it.moveToFirst() }
    }

    private fun nextOccurrenceAfter(rule: RecurringBillRule, occurrence: LocalDate): LocalDate {
        val interval = rule.intervalCount.coerceAtLeast(1)
        return when (rule.frequency) {
            RecurringFrequency.Daily -> occurrence.plusDays(interval.toLong())
            RecurringFrequency.Weekly -> occurrence.plusWeeks(interval.toLong())
            RecurringFrequency.Monthly -> {
                val month = YearMonth.from(occurrence).plusMonths(interval.toLong())
                month.atDay(min(rule.dayOfMonth ?: occurrence.dayOfMonth, month.lengthOfMonth()))
            }
            RecurringFrequency.Yearly -> {
                val month = (rule.monthOfYear ?: occurrence.monthValue).coerceIn(1, 12)
                val yearMonth = YearMonth.of(occurrence.year + interval, month)
                yearMonth.atDay(min(rule.dayOfMonth ?: occurrence.dayOfMonth, yearMonth.lengthOfMonth()))
            }
        }
    }

    private fun LocalDate.args() = arrayOf(year.toString(), monthValue.toString(), dayOfMonth.toString())

    private fun Bill.valuesWithoutId() = ContentValues().apply {
        put("mode", mode.name)
        put("amount", amount)
        put("type", type)
        put("remark", remark)
        put("year", date.year)
        put("month", date.monthValue)
        put("day", date.dayOfMonth)
        put("dateStr", dateStr)
        put("unix", unix)
        put("recurringRuleId", recurringRuleId)
        put("recurringOccurrenceDate", recurringOccurrenceDate?.toString())
    }

    private fun RecurringBillRule.valuesWithoutId() = ContentValues().apply {
        put("name", name)
        put("enabled", if (enabled) 1 else 0)
        put("mode", mode.name)
        put("amount", amount)
        put("type", type)
        put("remark", remark)
        put("frequency", frequency.name)
        put("intervalCount", intervalCount.coerceAtLeast(1))
        put("startDate", startDate.toString())
        put("endDate", endDate?.toString())
        put("dayOfMonth", dayOfMonth)
        put("dayOfWeek", dayOfWeek)
        put("monthOfYear", monthOfYear)
        put("nextRunDate", nextRunDate.toString())
        put("lastRunDate", lastRunDate?.toString())
        put("createdAt", createdAt)
        put("updatedAt", updatedAt)
    }

    private fun RecurringBillRule.valuesWithId() = valuesWithoutId().apply {
        if (id > 0) put("id", id)
    }

    private fun RecurringBillLog.valuesWithoutId() = ContentValues().apply {
        put("ruleId", ruleId)
        put("occurrenceDate", occurrenceDate.toString())
        put("billId", billId)
        put("createdAt", createdAt)
    }

    private fun RecurringBillLog.valuesWithId() = valuesWithoutId().apply {
        if (id > 0) put("id", id)
    }

    private fun Bill.toWebJson() = JSONObject()
        .put("id", id)
        .put("dateStr", dateStr)
        .put("date", JSONObject().put("year", date.year).put("month", date.monthValue).put("day", date.dayOfMonth))
        .put("time", JSONObject().put("hour", 0).put("minute", 0).put("second", 0))
        .put("mode", mode.name)
        .put("amount", amount)
        .put("remark", remark)
        .put("unix", unix)
        .put("type", type)
        .put("recurringRuleId", recurringRuleId ?: JSONObject.NULL)
        .put("recurringOccurrenceDate", recurringOccurrenceDate?.toString() ?: JSONObject.NULL)

    private fun RecurringBillRule.toJson() = JSONObject()
        .put("id", id)
        .put("name", name)
        .put("enabled", enabled)
        .put("mode", mode.name)
        .put("amount", amount)
        .put("type", type)
        .put("remark", remark)
        .put("frequency", frequency.name)
        .put("intervalCount", intervalCount)
        .put("startDate", startDate.toString())
        .put("endDate", endDate?.toString() ?: JSONObject.NULL)
        .put("dayOfMonth", dayOfMonth ?: JSONObject.NULL)
        .put("dayOfWeek", dayOfWeek ?: JSONObject.NULL)
        .put("monthOfYear", monthOfYear ?: JSONObject.NULL)
        .put("nextRunDate", nextRunDate.toString())
        .put("lastRunDate", lastRunDate?.toString() ?: JSONObject.NULL)
        .put("createdAt", createdAt)
        .put("updatedAt", updatedAt)

    private fun RecurringBillLog.toJson() = JSONObject()
        .put("id", id)
        .put("ruleId", ruleId)
        .put("occurrenceDate", occurrenceDate.toString())
        .put("billId", billId)
        .put("createdAt", createdAt)

    private fun JSONObject.toBill(mode: BillMode): Bill {
        val dateObj = optJSONObject("date")
        val parsedDate = if (dateObj != null) {
            LocalDate.of(dateObj.getInt("year"), dateObj.getInt("month"), dateObj.getInt("day"))
        } else {
            LocalDate.parse(getString("dateStr"))
        }
        return Bill(
            id = optLong("id", 0),
            mode = mode,
            amount = getDouble("amount"),
            type = getString("type"),
            remark = optString("remark", ""),
            date = parsedDate,
            unix = optLong("unix", nowSeconds()),
            recurringRuleId = optNullableLong("recurringRuleId"),
            recurringOccurrenceDate = optNullableDate("recurringOccurrenceDate")
        )
    }

    private fun JSONObject.toRecurringRule(): RecurringBillRule =
        RecurringBillRule(
            id = optLong("id", 0),
            name = getString("name"),
            enabled = optBoolean("enabled", true),
            mode = BillMode.valueOf(getString("mode")),
            amount = getDouble("amount"),
            type = getString("type"),
            remark = optString("remark", ""),
            frequency = RecurringFrequency.valueOf(getString("frequency")),
            intervalCount = optInt("intervalCount", 1).coerceAtLeast(1),
            startDate = LocalDate.parse(getString("startDate")),
            endDate = optNullableDate("endDate"),
            dayOfMonth = optNullableInt("dayOfMonth"),
            dayOfWeek = optNullableInt("dayOfWeek"),
            monthOfYear = optNullableInt("monthOfYear"),
            nextRunDate = LocalDate.parse(getString("nextRunDate")),
            lastRunDate = optNullableDate("lastRunDate"),
            createdAt = optLong("createdAt", nowSeconds()),
            updatedAt = optLong("updatedAt", nowSeconds())
        )

    private fun JSONObject.toRecurringLog(): RecurringBillLog =
        RecurringBillLog(
            id = optLong("id", 0),
            ruleId = getLong("ruleId"),
            occurrenceDate = LocalDate.parse(getString("occurrenceDate")),
            billId = getLong("billId"),
            createdAt = optLong("createdAt", nowSeconds())
        )

    private fun Cursor.toBill(): Bill =
        Bill(
            id = getLong(getColumnIndexOrThrow("id")),
            mode = BillMode.valueOf(getString(getColumnIndexOrThrow("mode"))),
            amount = getDouble(getColumnIndexOrThrow("amount")),
            type = getString(getColumnIndexOrThrow("type")),
            remark = getString(getColumnIndexOrThrow("remark")),
            date = LocalDate.of(
                getInt(getColumnIndexOrThrow("year")),
                getInt(getColumnIndexOrThrow("month")),
                getInt(getColumnIndexOrThrow("day"))
            ),
            unix = getLong(getColumnIndexOrThrow("unix")),
            recurringRuleId = nullableLong("recurringRuleId"),
            recurringOccurrenceDate = nullableDate("recurringOccurrenceDate")
        )

    private fun Cursor.toRecurringRule(): RecurringBillRule =
        RecurringBillRule(
            id = getLong(getColumnIndexOrThrow("id")),
            name = getString(getColumnIndexOrThrow("name")),
            enabled = getInt(getColumnIndexOrThrow("enabled")) == 1,
            mode = BillMode.valueOf(getString(getColumnIndexOrThrow("mode"))),
            amount = getDouble(getColumnIndexOrThrow("amount")),
            type = getString(getColumnIndexOrThrow("type")),
            remark = getString(getColumnIndexOrThrow("remark")),
            frequency = RecurringFrequency.valueOf(getString(getColumnIndexOrThrow("frequency"))),
            intervalCount = getInt(getColumnIndexOrThrow("intervalCount")).coerceAtLeast(1),
            startDate = LocalDate.parse(getString(getColumnIndexOrThrow("startDate"))),
            endDate = nullableDate("endDate"),
            dayOfMonth = nullableInt("dayOfMonth"),
            dayOfWeek = nullableInt("dayOfWeek"),
            monthOfYear = nullableInt("monthOfYear"),
            nextRunDate = LocalDate.parse(getString(getColumnIndexOrThrow("nextRunDate"))),
            lastRunDate = nullableDate("lastRunDate"),
            createdAt = getLong(getColumnIndexOrThrow("createdAt")),
            updatedAt = getLong(getColumnIndexOrThrow("updatedAt"))
        )

    private fun Cursor.toRecurringLog(): RecurringBillLog =
        RecurringBillLog(
            id = getLong(getColumnIndexOrThrow("id")),
            ruleId = getLong(getColumnIndexOrThrow("ruleId")),
            occurrenceDate = LocalDate.parse(getString(getColumnIndexOrThrow("occurrenceDate"))),
            billId = getLong(getColumnIndexOrThrow("billId")),
            createdAt = getLong(getColumnIndexOrThrow("createdAt"))
        )

    private fun Cursor.nullableInt(column: String): Int? {
        val idx = getColumnIndex(column)
        return if (idx < 0 || isNull(idx)) null else getInt(idx)
    }

    private fun Cursor.nullableLong(column: String): Long? {
        val idx = getColumnIndex(column)
        return if (idx < 0 || isNull(idx)) null else getLong(idx)
    }

    private fun Cursor.nullableDate(column: String): LocalDate? {
        val idx = getColumnIndex(column)
        return if (idx < 0 || isNull(idx)) null else LocalDate.parse(getString(idx))
    }

    private fun JSONObject.optNullableInt(key: String): Int? =
        if (has(key) && !isNull(key)) optInt(key) else null

    private fun JSONObject.optNullableLong(key: String): Long? =
        if (has(key) && !isNull(key)) optLong(key) else null

    private fun JSONObject.optNullableDate(key: String): LocalDate? =
        if (has(key) && !isNull(key)) LocalDate.parse(optString(key)) else null

    private fun nowSeconds(): Long = System.currentTimeMillis() / 1000
}
