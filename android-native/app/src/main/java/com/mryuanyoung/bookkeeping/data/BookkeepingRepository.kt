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

    fun availableYears(): List<Int> {
        val cursor = readableDatabase.rawQuery("SELECT DISTINCT year FROM bills ORDER BY year DESC", null)
        cursor.use {
            val years = mutableListOf<Int>()
            while (it.moveToNext()) years.add(it.getInt(0))
            return years
        }
    }

    fun monthlySummary(year: Int): List<Pair<Int, BillSummary>> =
        (1..12).map { month -> month to summary(findByMonth(year, month)) }

    fun dailySummary(year: Int, month: Int): List<Pair<Int, BillSummary>> {
        val days = java.time.YearMonth.of(year, month).lengthOfMonth()
        return (1..days).map { day -> day to summary(findByDay(LocalDate.of(year, month, day))) }
    }

    fun yearlySummary(): List<Pair<Int, BillSummary>> =
        availableYears().sorted().map { year -> year to summary(findByYear(year)) }

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

    private fun query(where: String?, args: Array<String>): List<Bill> {
        val cursor = readableDatabase.query(
            "bills",
            null,
            where,
            args,
            null,
            null,
            "year DESC, month DESC, day DESC, unix DESC"
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
