package com.mryuanyoung.bookkeeping.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate

class BookkeepingRepository(context: Context) :
    SQLiteOpenHelper(context, "bookkeeping.db", null, 1) {

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
                unix INTEGER NOT NULL
            )
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX idx_bills_date ON bills(year, month, day)")
        db.execSQL("CREATE INDEX idx_bills_mode_date ON bills(mode, dateStr)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    fun create(bill: Bill): Long {
        val id = writableDatabase.insert("bills", null, bill.valuesWithoutId())
        return id
    }

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

    fun availableYears(): List<Int> {
        val cursor = readableDatabase.rawQuery("SELECT DISTINCT year FROM bills ORDER BY year DESC", null)
        cursor.use {
            val years = mutableListOf<Int>()
            while (it.moveToNext()) years.add(it.getInt(0))
            return years
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
            .toString(2)
    }

    fun importJson(text: String) {
        val root = JSONObject(text)
        val bills = mutableListOf<Bill>()
        root.optJSONArray("importBill")?.let { arr ->
            for (i in 0 until arr.length()) bills.add(arr.getJSONObject(i).toBill(BillMode.Import))
        }
        root.optJSONArray("exportBill")?.let { arr ->
            for (i in 0 until arr.length()) bills.add(arr.getJSONObject(i).toBill(BillMode.Export))
        }

        writableDatabase.beginTransaction()
        try {
            writableDatabase.delete("bills", null, null)
            bills.forEach { writableDatabase.insert("bills", null, it.valuesWithoutId()) }
            writableDatabase.setTransactionSuccessful()
        } finally {
            writableDatabase.endTransaction()
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
            while (it.moveToNext()) {
                result.add(
                    Bill(
                        id = it.getLong(it.getColumnIndexOrThrow("id")),
                        mode = BillMode.valueOf(it.getString(it.getColumnIndexOrThrow("mode"))),
                        amount = it.getDouble(it.getColumnIndexOrThrow("amount")),
                        type = it.getString(it.getColumnIndexOrThrow("type")),
                        remark = it.getString(it.getColumnIndexOrThrow("remark")),
                        date = LocalDate.of(
                            it.getInt(it.getColumnIndexOrThrow("year")),
                            it.getInt(it.getColumnIndexOrThrow("month")),
                            it.getInt(it.getColumnIndexOrThrow("day"))
                        ),
                        unix = it.getLong(it.getColumnIndexOrThrow("unix"))
                    )
                )
            }
            return result
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
            unix = optLong("unix", System.currentTimeMillis() / 1000)
        )
    }
}
