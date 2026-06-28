package com.mryuanyoung.bookkeeping

import android.app.Activity
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.widget.ArrayAdapter
import android.widget.AdapterView
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import com.mryuanyoung.bookkeeping.calc.EstateCalculator
import com.mryuanyoung.bookkeeping.calc.EstateInput
import com.mryuanyoung.bookkeeping.calc.HousingFundCalculator
import com.mryuanyoung.bookkeeping.calc.Loan
import com.mryuanyoung.bookkeeping.calc.PaymentType
import com.mryuanyoung.bookkeeping.calc.SalaryCalculator
import com.mryuanyoung.bookkeeping.calc.SalaryInput
import com.mryuanyoung.bookkeeping.data.Bill
import com.mryuanyoung.bookkeeping.data.BillMode
import com.mryuanyoung.bookkeeping.data.BillSummary
import com.mryuanyoung.bookkeeping.data.BookkeepingRepository
import com.mryuanyoung.bookkeeping.data.CategorySummary
import com.mryuanyoung.bookkeeping.data.ExportBillType
import com.mryuanyoung.bookkeeping.data.ImportBillType
import com.mryuanyoung.bookkeeping.data.RecurringBillRule
import com.mryuanyoung.bookkeeping.data.RecurringFrequency
import com.mryuanyoung.bookkeeping.ui.ChartEntry
import com.mryuanyoung.bookkeeping.ui.ChartMode
import com.mryuanyoung.bookkeeping.ui.StatChartView
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.min

class MainActivity : Activity() {
    private lateinit var repository: BookkeepingRepository
    private lateinit var content: FrameLayout
    private lateinit var navContainer: LinearLayout
    private var editingBill: Bill? = null
    private var selectedBillDate: LocalDate = LocalDate.now()
    private var statsDate: LocalDate = LocalDate.now()
    private var statsScope: StatsScope = StatsScope.Month
    private var accountSubTab: AccountSubTab = AccountSubTab.Detail
    private var currentTab: MainTab = MainTab.Record

    private enum class StatsScope(val label: String) {
        Day("日"),
        Month("月"),
        Year("年"),
        All("总")
    }

    private enum class MainTab {
        Record,
        Account,
        Profile
    }

    private enum class AccountSubTab(val label: String) {
        Detail("明细"),
        Stats("统计")
    }

    private data class StatsReport(
        val detailBills: List<Bill>,
        val summary: BillSummary,
        val expenseCategories: List<CategorySummary>,
        val incomeCategories: List<CategorySummary>,
        val detailLimited: Boolean
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = BookkeepingRepository(this)
        repository.generateDueRecurringBills()
        buildShell()
        showRecord()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (resultCode != RESULT_OK) return
        when (requestCode) {
            REQ_IMPORT_JSON -> {
                val uri = data?.data ?: return
                runCatching {
                    contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                        ?: error("文件为空")
                }.onSuccess {
                    repository.importJson(it)
                    toast("导入成功")
                    showAccount()
                }.onFailure { toast("导入失败: ${it.message}") }
            }

            REQ_EXPORT_JSON -> {
                val uri = data?.data ?: return
                runCatching {
                    contentResolver.openOutputStream(uri)?.bufferedWriter()?.use {
                        it.write(repository.exportJson())
                    } ?: error("无法打开文件")
                }.onSuccess {
                    toast("导出成功")
                }.onFailure { toast("导出失败: ${it.message}") }
            }
        }
    }

    private fun buildShell() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Bg)
        }
        root.setOnApplyWindowInsetsListener { view, insets ->
            val top: Int
            val bottom: Int
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                top = bars.top
                bottom = bars.bottom
            } else {
                @Suppress("DEPRECATION")
                top = insets.systemWindowInsetTop
                @Suppress("DEPRECATION")
                bottom = insets.systemWindowInsetBottom
            }
            view.setPadding(0, top, 0, bottom)
            insets
        }
        content = FrameLayout(this)
        root.addView(content, LinearLayout.LayoutParams(-1, 0, 1f))
        navContainer = bottomNav()
        root.addView(navContainer)
        setContentView(root)
        renderBottomNav()
    }

    private fun bottomNav(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        setPadding(dp(8), dp(6), dp(8), dp(6))
        setBackgroundColor(Color.WHITE)
    }

    private fun renderBottomNav() {
        navContainer.removeAllViews()
        navContainer.addView(navButton("记账", "✎", MainTab.Record) { showRecord() })
        navContainer.addView(navButton("账单", "▤", MainTab.Account) { showAccount() })
        navContainer.addView(navButton("个人", "◎", MainTab.Profile) { showProfile() })
    }

    private fun navButton(text: String, icon: String, tab: MainTab, action: () -> Unit): TextView =
        TextView(this).apply {
            this.text = "$icon\n$text"
            gravity = Gravity.CENTER
            textSize = 13f
            val selected = tab == currentTab
            setTextColor(if (selected) Color.WHITE else Primary)
            setTypeface(Typeface.DEFAULT, if (selected) Typeface.BOLD else Typeface.NORMAL)
            background = if (selected) rounded(Primary, dp(10).toFloat()) else rounded(Color.TRANSPARENT, dp(10).toFloat())
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(0, dp(56), 1f).apply {
                setMargins(dp(4), 0, dp(4), 0)
            }
        }

    private fun showRecord() {
        repository.generateDueRecurringBills()
        currentTab = MainTab.Record
        renderBottomNav()
        val page = page()
        page.addView(title(if (editingBill == null) "记一笔" else "编辑账单"))
        page.addView(outlineButton("周期记账") { showRecurringBills() })
        page.addView(billForm { showRecord() })
        page.addView(sectionTitle("今天"))
        page.addView(billList(repository.findByDay(LocalDate.now()), allowEdit = true))
        replace(page)
    }

    private fun billForm(afterSave: () -> Unit): View {
        val bill = editingBill
        val box = verticalBox()
        selectedBillDate = bill?.date ?: LocalDate.now()

        val modeGroup = RadioGroup(this).apply {
            orientation = RadioGroup.HORIZONTAL
            addView(radio("支出", BillMode.Export.name, bill?.mode != BillMode.Import))
            addView(radio("收入", BillMode.Import.name, bill?.mode == BillMode.Import))
        }
        val typeSpinner = Spinner(this)
        val amount = input("金额", bill?.amount?.toString().orEmpty(), decimal = true)
        val remark = input("备注", bill?.remark.orEmpty())
        val dateButton = outlineButton(selectedBillDate.toString()) {
            pickDate(selectedBillDate) { date ->
                selectedBillDate = date
                (it as Button).text = date.toString()
            }
        }

        fun refreshTypes() {
            val mode = selectedMode(modeGroup)
            val pairs = if (mode == BillMode.Export) {
                ExportBillType.entries.map { it.name to it.label }
            } else {
                ImportBillType.entries.map { it.name to it.label }
            }
            typeSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, pairs.map { it.second })
            typeSpinner.tag = pairs
            typeSpinner.setSelection(pairs.indexOfFirst { it.first == bill?.type }.takeIf { it >= 0 } ?: 0)
        }

        modeGroup.setOnCheckedChangeListener { _, _ -> refreshTypes() }
        refreshTypes()

        box.addView(label("类型"))
        box.addView(modeGroup)
        box.addView(label("类别"))
        box.addView(typeSpinner)
        box.addView(label("日期"))
        box.addView(dateButton)
        box.addView(amount)
        box.addView(remark)
        box.addView(primaryButton(if (bill == null) "记账" else "保存修改") {
            val value = amount.num()
            if (value <= 0) {
                toast("请输入有效金额")
                return@primaryButton
            }
            @Suppress("UNCHECKED_CAST")
            val pairs = typeSpinner.tag as List<Pair<String, String>>
            val target = Bill(
                id = bill?.id ?: 0,
                mode = selectedMode(modeGroup),
                amount = value,
                type = pairs[typeSpinner.selectedItemPosition].first,
                remark = remark.text.toString(),
                date = selectedBillDate,
                unix = bill?.unix ?: System.currentTimeMillis() / 1000
            )
            if (bill == null) repository.create(target) else repository.update(target)
            editingBill = null
            toast("已保存")
            afterSave()
        })
        if (bill != null) {
            box.addView(outlineButton("取消编辑") {
                editingBill = null
                afterSave()
            })
            box.addView(dangerButton("删除") {
                repository.delete(bill.id)
                editingBill = null
                toast("已删除")
                afterSave()
            })
        }
        return card(box)
    }

    private fun showAccount() {
        renderStats(StatsScope.Month)
    }

    private fun renderStats(scope: StatsScope = statsScope) {
        currentTab = MainTab.Account
        renderBottomNav()
        statsScope = scope
        val page = page()
        page.addView(title("账单"))
        page.addView(scopeTabs(scope))
        page.addView(periodControls(scope))
        page.addView(outlineButton("搜索账单") { showBillSearch() })

        val report = statsReport(scope)
        addBillSummary(page, report.summary, periodTitle(scope))
        page.addView(accountSubTabs(accountSubTab, scope))
        when (accountSubTab) {
            AccountSubTab.Detail -> {
                page.addView(sectionTitle(if (report.detailLimited) "账单明细(最近300笔)" else "账单明细"))
                page.addView(billList(report.detailBills, allowEdit = true))
            }

            AccountSubTab.Stats -> addStatsContent(page, scope, report)
        }
        replace(page)
    }

    private fun scopeTabs(selected: StatsScope): View = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        StatsScope.entries.forEach { scope ->
            addView(if (scope == selected) primarySmallButton(scope.label) { renderStats(scope) } else smallButton(scope.label) { renderStats(scope) })
        }
    }

    private fun accountSubTabs(selected: AccountSubTab, scope: StatsScope): View = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        AccountSubTab.entries.forEach { tab ->
            addView(
                if (tab == selected) {
                    primarySmallButton(tab.label) {
                        accountSubTab = tab
                        renderStats(scope)
                    }
                } else {
                    smallButton(tab.label) {
                        accountSubTab = tab
                        renderStats(scope)
                    }
                }
            )
        }
    }

    private fun periodControls(scope: StatsScope): View = card(LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        if (scope == StatsScope.All) {
            addView(text("全部账单", weight = 1f))
            addView(periodButton("本月") {
                statsDate = LocalDate.now()
                renderStats(StatsScope.Month)
            })
            return@apply
        }
        addView(periodButton("‹") {
            statsDate = when (scope) {
                StatsScope.Day -> statsDate.minusDays(1)
                StatsScope.Month -> statsDate.minusMonths(1)
                StatsScope.Year -> statsDate.minusYears(1)
                StatsScope.All -> statsDate
            }
            renderStats(scope)
        })
        addView(TextView(this@MainActivity).apply {
            text = periodTitle(scope)
            gravity = Gravity.CENTER
            textSize = 16f
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            setTextColor(TextMain)
            layoutParams = LinearLayout.LayoutParams(0, -2, 1f)
            setOnClickListener {
                pickDate(statsDate) {
                    statsDate = it
                    renderStats(scope)
                }
            }
        })
        addView(periodButton(currentPeriodLabel(scope)) {
            statsDate = LocalDate.now()
            renderStats(scope)
        })
        addView(periodButton("›") {
            statsDate = when (scope) {
                StatsScope.Day -> statsDate.plusDays(1)
                StatsScope.Month -> statsDate.plusMonths(1)
                StatsScope.Year -> statsDate.plusYears(1)
                StatsScope.All -> statsDate
            }
            renderStats(scope)
        })
    })

    private fun billsFor(scope: StatsScope): List<Bill> =
        when (scope) {
            StatsScope.Day -> repository.findByDay(statsDate)
            StatsScope.Month -> repository.findByMonth(statsDate.year, statsDate.monthValue)
            StatsScope.Year -> repository.findByYear(statsDate.year)
            StatsScope.All -> repository.findAll()
        }

    private fun statsReport(scope: StatsScope): StatsReport =
        when (scope) {
            StatsScope.Day -> StatsReport(
                detailBills = repository.findByDay(statsDate),
                summary = repository.daySummary(statsDate),
                expenseCategories = repository.categorySummaryByDay(statsDate, BillMode.Export),
                incomeCategories = repository.categorySummaryByDay(statsDate, BillMode.Import),
                detailLimited = false
            )

            StatsScope.Month -> StatsReport(
                detailBills = repository.findByMonth(statsDate.year, statsDate.monthValue),
                summary = repository.monthSummary(statsDate.year, statsDate.monthValue),
                expenseCategories = repository.categorySummaryByMonth(statsDate.year, statsDate.monthValue, BillMode.Export),
                incomeCategories = repository.categorySummaryByMonth(statsDate.year, statsDate.monthValue, BillMode.Import),
                detailLimited = false
            )

            StatsScope.Year -> StatsReport(
                detailBills = repository.findRecentByYear(statsDate.year, DETAIL_LIMIT),
                summary = repository.yearSummary(statsDate.year),
                expenseCategories = repository.categorySummaryByYear(statsDate.year, BillMode.Export),
                incomeCategories = repository.categorySummaryByYear(statsDate.year, BillMode.Import),
                detailLimited = true
            )

            StatsScope.All -> StatsReport(
                detailBills = repository.findRecent(DETAIL_LIMIT),
                summary = repository.allSummary(),
                expenseCategories = repository.categorySummaryAll(BillMode.Export),
                incomeCategories = repository.categorySummaryAll(BillMode.Import),
                detailLimited = true
            )
        }

    private fun periodTitle(scope: StatsScope): String =
        when (scope) {
            StatsScope.Day -> "${statsDate.year}-${two(statsDate.monthValue)}-${two(statsDate.dayOfMonth)}"
            StatsScope.Month -> "${statsDate.year}年${statsDate.monthValue}月"
            StatsScope.Year -> "${statsDate.year}年"
            StatsScope.All -> "全部账单"
        }

    private fun showBillSearch(
        keyword: String = "",
        startDate: LocalDate? = null,
        endDate: LocalDate? = null,
        mode: BillMode? = BillMode.Export,
        minAmount: String = "",
        maxAmount: String = "",
        hasSearched: Boolean = false
    ) {
        currentTab = MainTab.Account
        renderBottomNav()

        var selectedStartDate = startDate
        var selectedEndDate = endDate
        val page = page()
        page.addView(title("搜索账单"))
        page.addView(outlineButton("返回账单") { renderStats(statsScope) })

        val keywordInput = input("备注关键词", keyword)
        val modeGroup = RadioGroup(this).apply {
            orientation = RadioGroup.HORIZONTAL
            addView(radio("支出", BillMode.Export.name, mode == BillMode.Export))
            addView(radio("收入", BillMode.Import.name, mode == BillMode.Import))
            addView(radio("全部", SEARCH_MODE_ALL, mode == null))
        }
        val minInput = input("最低金额", minAmount, decimal = true)
        val maxInput = input("最高金额", maxAmount, decimal = true)

        page.addView(card(verticalBox().apply {
            addView(sectionTitle("筛选条件"))
            addView(label("备注"))
            addView(keywordInput)
            addView(label("类型"))
            addView(modeGroup)
            addView(label("日期范围"))
            addView(dateRangeControls(selectedStartDate, selectedEndDate) { start, end ->
                selectedStartDate = start
                selectedEndDate = end
            })
            addView(label("金额区间"))
            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                addView(minInput, LinearLayout.LayoutParams(0, -2, 1f).apply {
                    setMargins(0, 0, dp(6), 0)
                })
                addView(maxInput, LinearLayout.LayoutParams(0, -2, 1f).apply {
                    setMargins(dp(6), 0, 0, 0)
                })
            })
            addView(primaryButton("搜索") {
                showBillSearch(
                    keyword = keywordInput.text.toString(),
                    startDate = selectedStartDate,
                    endDate = selectedEndDate,
                    mode = selectedSearchMode(modeGroup),
                    minAmount = minInput.text.toString(),
                    maxAmount = maxInput.text.toString(),
                    hasSearched = true
                )
            })
        }))

        if (hasSearched) {
            val result = searchBills(keyword, startDate, endDate, mode, minAmount, maxAmount)
            page.addView(sectionTitle("搜索结果(${result.size})"))
            page.addView(billList(result, allowEdit = true))
        } else {
            page.addView(card(verticalBox().apply {
                addView(text("设置条件后点击搜索查看结果"))
            }))
        }
        replace(page)
    }

    private fun dateRangeControls(
        startDate: LocalDate?,
        endDate: LocalDate?,
        onChanged: (LocalDate?, LocalDate?) -> Unit
    ): View {
        var start = startDate
        var end = endDate
        lateinit var startButton: Button
        lateinit var endButton: Button
        fun refresh() {
            startButton.text = start?.toString() ?: "开始日期"
            endButton.text = end?.toString() ?: "结束日期"
            onChanged(start, end)
        }
        return verticalBox().apply {
            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                addView(smallButton("全部日期") {
                    start = null
                    end = null
                    refresh()
                })
                addView(smallButton("本月") {
                    val month = YearMonth.from(LocalDate.now())
                    start = month.atDay(1)
                    end = month.atEndOfMonth()
                    refresh()
                })
            })
            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                startButton = periodButton(start?.toString() ?: "开始日期") {
                    pickDate(start ?: defaultSearchStartDate()) { picked ->
                        start = picked
                        refresh()
                    }
                }
                endButton = periodButton(end?.toString() ?: "结束日期") {
                    pickDate(end ?: defaultSearchEndDate()) { picked ->
                        end = picked
                        refresh()
                    }
                }
                addView(startButton, LinearLayout.LayoutParams(0, dp(44), 1f).apply {
                    setMargins(0, 0, dp(6), 0)
                })
                addView(endButton, LinearLayout.LayoutParams(0, dp(44), 1f).apply {
                    setMargins(dp(6), 0, 0, 0)
                })
            })
        }
    }

    private fun searchBills(
        keyword: String,
        startDate: LocalDate?,
        endDate: LocalDate?,
        mode: BillMode?,
        minAmount: String,
        maxAmount: String
    ): List<Bill> {
        return repository.searchBills(
            keyword = keyword,
            startDate = startDate,
            endDate = endDate,
            mode = mode,
            minAmount = minAmount.toDoubleOrNull(),
            maxAmount = maxAmount.toDoubleOrNull()
        )
    }

    private fun selectedSearchMode(group: RadioGroup): BillMode? =
        when (selectedRadioTag(group, BillMode.Export.name)) {
            BillMode.Import.name -> BillMode.Import
            SEARCH_MODE_ALL -> null
            else -> BillMode.Export
        }

    private fun defaultSearchStartDate(): LocalDate =
        YearMonth.from(LocalDate.now()).atDay(1)

    private fun defaultSearchEndDate(): LocalDate =
        YearMonth.from(LocalDate.now()).atEndOfMonth()

    private fun addBillSummary(page: LinearLayout, summary: BillSummary, heading: String) {
        page.addView(card(verticalBox().apply {
            addView(sectionTitle("$heading 总览"))
            addView(summaryMetricRow(
                summaryMetric("收入", money(summary.income), Good),
                summaryMetric("支出", money(summary.expense), Danger)
            ))
            addView(summaryMetricRow(
                summaryMetric("结余", money(summary.balance), if (summary.balance >= 0) Good else Danger),
                summaryMetric("笔数", "${summary.count}", TextMain)
            ))
        }))
    }

    private fun addStatsContent(page: LinearLayout, scope: StatsScope, report: StatsReport) {
        page.addView(sectionTitle("${periodTitle(scope)}统计"))
        page.addView(categoryCard("支出按类别", report.expenseCategories, ChartMode.Pie))
        page.addView(largestExpenseCard(billsFor(scope)))
        page.addView(categoryCard("收入按类别", report.incomeCategories, ChartMode.Pie))
    }

    private fun categoryCard(title: String, stats: List<CategorySummary>, mode: ChartMode): View {
        val box = verticalBox()
        box.addView(sectionTitle(title))
        val entries = stats.take(8).mapIndexed { index, item ->
            ChartEntry(item.label, item.amount, Palette[index % Palette.size])
        }
        box.addView(StatChartView(this).apply {
            setData(entries, mode)
            layoutParams = LinearLayout.LayoutParams(-1, dp(260))
        })
        if (stats.isEmpty()) {
            box.addView(text("暂无数据"))
        } else {
            stats.forEach { box.addView(metricRow(it.label, money(it.amount), TextMain)) }
        }
        return card(box)
    }

    private fun largestExpenseCard(bills: List<Bill>): View {
        val expenses = bills
            .filter { it.mode == BillMode.Export }
            .sortedByDescending { it.amount }
            .take(LARGEST_EXPENSE_LIMIT)
        val box = verticalBox()
        box.addView(sectionTitle("支出金额最大10笔"))
        if (expenses.isEmpty()) {
            box.addView(text("暂无支出"))
        } else {
            expenses.forEachIndexed { index, bill ->
                box.addView(rankedBillRow(index + 1, bill))
            }
        }
        return card(box)
    }

    private fun rankedBillRow(rank: Int, bill: Bill): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(8), 0, dp(8))
            addView(text("$rank.").apply {
                setTypeface(Typeface.DEFAULT, Typeface.BOLD)
                setTextColor(TextMuted)
                layoutParams = LinearLayout.LayoutParams(dp(34), -2)
            })
            addView(verticalBox().apply {
                addView(text(bill.typeLabel))
                val note = listOf(bill.date.toString(), bill.remark)
                    .filter { it.isNotBlank() }
                    .joinToString(" · ")
                addView(text(note, small = true))
            }, LinearLayout.LayoutParams(0, -2, 1f))
            addView(text(money(bill.amount)).apply {
                setTextColor(Danger)
                gravity = Gravity.END
            })
            setOnClickListener {
                editingBill = bill
                showRecord()
            }
        }

    private fun trendCard(title: String, scope: StatsScope, mode: BillMode): View {
        val box = verticalBox()
        box.addView(sectionTitle(title))
        val entries = trendEntries(scope, mode)
        box.addView(StatChartView(this).apply {
            setData(entries, ChartMode.Bar)
            layoutParams = LinearLayout.LayoutParams(-1, dp(260))
        })
        return card(box)
    }

    private fun trendEntries(scope: StatsScope, mode: BillMode): List<ChartEntry> {
        val summaries = when (scope) {
            StatsScope.Day -> listOf(statsDate.dayOfMonth to repository.daySummary(statsDate))
            StatsScope.Month -> repository.dailySummary(statsDate.year, statsDate.monthValue)
            StatsScope.Year -> repository.monthlySummary(statsDate.year)
            StatsScope.All -> repository.yearlySummary()
        }
        return summaries.mapIndexed { index, item ->
            val (period, summary) = item
            val label = when (scope) {
                StatsScope.Day -> "${period}日"
                StatsScope.Month -> "${period}日"
                StatsScope.Year -> "${period}月"
                StatsScope.All -> "${period}年"
            }
            ChartEntry(label, if (mode == BillMode.Export) summary.expense else summary.income, Palette[index % Palette.size])
        }
    }

    private fun billList(bills: List<Bill>, allowEdit: Boolean): View {
        val box = verticalBox()
        if (bills.isEmpty()) {
            box.addView(text("暂无记录"))
            return card(box)
        }
        var currentDate: LocalDate? = null
        bills.forEach { bill ->
            if (currentDate != bill.date) {
                currentDate = bill.date
                box.addView(sectionTitle(bill.date.toString()))
            }
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, dp(10), 0, dp(10))
                addView(verticalBox().apply {
                    addView(text(bill.typeLabel))
                    if (bill.remark.isNotBlank()) addView(text(bill.remark, small = true))
                }, LinearLayout.LayoutParams(0, -2, 1f))
                addView(text("${if (bill.mode == BillMode.Export) "-" else "+"}${money(bill.amount)}").apply {
                    setTextColor(if (bill.mode == BillMode.Export) Danger else Good)
                    gravity = Gravity.END
                })
                if (allowEdit) setOnClickListener {
                    editingBill = bill
                    showRecord()
                }
            }
            box.addView(row)
        }
        return card(box)
    }

    private fun showRecurringBills() {
        currentTab = MainTab.Record
        renderBottomNav()
        val page = page()
        page.addView(title("周期记账"))
        page.addView(outlineButton("返回记账") { showRecord() })
        page.addView(primaryButton("新增周期记账") { showRecurringRuleDialog() })
        page.addView(outlineButton("立即检查并生成") {
            val count = repository.generateDueRecurringBills()
            toast("已生成 ${count} 笔周期账单")
            showRecurringBills()
        })
        page.addView(sectionTitle("周期规则"))
        page.addView(recurringRuleList(repository.findRecurringRules()))
        replace(page)
    }

    private fun recurringRuleList(rules: List<RecurringBillRule>): View {
        val box = verticalBox()
        if (rules.isEmpty()) {
            box.addView(text("暂无周期记账规则"))
            return card(box)
        }
        rules.forEach { rule ->
            box.addView(sectionTitle(rule.name))
            box.addView(text("${recurringText(rule)} | ${if (rule.mode == BillMode.Export) "支出" else "收入"} ${money(rule.amount)} | ${rule.typeLabel}"))
            if (rule.remark.isNotBlank()) box.addView(text(rule.remark, small = true))
            box.addView(text("下次生成: ${rule.nextRunDate}", small = true))
            box.addView(text("状态: ${if (rule.enabled) "启用" else "停用"}", small = true))
            box.addView(LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                addView(smallButton(if (rule.enabled) "停用" else "启用") {
                    repository.setRecurringRuleEnabled(rule.id, !rule.enabled)
                    showRecurringBills()
                })
                addView(smallButton("编辑") { showRecurringRuleDialog(rule) })
                addView(smallButton("删除") {
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("删除周期记账")
                        .setMessage("已生成的账单会保留，只删除这条周期规则。")
                        .setPositiveButton("删除") { _, _ ->
                            repository.deleteRecurringRule(rule.id)
                            showRecurringBills()
                        }
                        .setNegativeButton("取消", null)
                        .show()
                })
            })
            box.addView(dividerView())
        }
        return card(box)
    }

    private fun showRecurringRuleDialog(rule: RecurringBillRule? = null) {
        val box = verticalBox()
        val now = LocalDate.now()
        var startDate = rule?.startDate ?: now
        var endDate = rule?.endDate

        val name = input("名称", rule?.name.orEmpty())
        val enabled = CheckBox(this).apply {
            text = "启用"
            isChecked = rule?.enabled ?: true
        }
        val modeGroup = RadioGroup(this).apply {
            orientation = RadioGroup.HORIZONTAL
            addView(radio("支出", BillMode.Export.name, rule?.mode != BillMode.Import))
            addView(radio("收入", BillMode.Import.name, rule?.mode == BillMode.Import))
        }
        val typeSpinner = Spinner(this)
        val amount = input("金额", rule?.amount?.toString().orEmpty(), decimal = true)
        val remark = input("备注", rule?.remark.orEmpty())
        val frequencyPairs = RecurringFrequency.entries.map {
            it to when (it) {
                RecurringFrequency.Daily -> "每天"
                RecurringFrequency.Weekly -> "每周"
                RecurringFrequency.Monthly -> "每月"
                RecurringFrequency.Yearly -> "每年"
            }
        }
        val frequencySpinner = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item, frequencyPairs.map { it.second })
            setSelection(frequencyPairs.indexOfFirst { it.first == rule?.frequency }.takeIf { it >= 0 } ?: 2)
        }
        val interval = input("间隔周期数", (rule?.intervalCount ?: 1).toString(), decimal = false)
        val dayOfWeek = input("每周几(1-7)", (rule?.dayOfWeek ?: now.dayOfWeek.value).toString(), decimal = false)
        val dayOfMonth = input("每月/每年几号(1-31)", (rule?.dayOfMonth ?: now.dayOfMonth).toString(), decimal = false)
        val monthOfYear = input("每年几月(1-12)", (rule?.monthOfYear ?: now.monthValue).toString(), decimal = false)
        val frequencyHint = text("", small = true)
        val intervalBox = verticalBox().apply {
            addView(label("间隔"))
            addView(text("填 1 表示每个周期都生成；填 2 表示每隔一个周期生成。", small = true))
            addView(interval)
        }
        val weeklyBox = verticalBox().apply {
            addView(label("周几"))
            addView(text("仅每周使用。1 到 7 分别表示周一到周日。", small = true))
            addView(dayOfWeek)
        }
        val monthlyDayBox = verticalBox().apply {
            addView(label("几号"))
            addView(text("仅每月/每年使用。比如房租每月 1 号扣款就填 1。", small = true))
            addView(dayOfMonth)
        }
        val yearlyMonthBox = verticalBox().apply {
            addView(label("月份"))
            addView(text("仅每年使用。比如每年 6 月生成就填 6。", small = true))
            addView(monthOfYear)
        }
        val startButton = outlineButton(startDate.toString()) {
            pickDate(startDate) { date ->
                startDate = date
                (it as Button).text = date.toString()
            }
        }
        val endButton = outlineButton(endDate?.toString() ?: "不设置结束日期") {
            pickDate(endDate ?: startDate) { date ->
                endDate = date
                (it as Button).text = date.toString()
            }
        }
        val clearEndButton = outlineButton("清除结束日期") {
            endDate = null
            endButton.text = "不设置结束日期"
        }

        fun refreshTypes() {
            val mode = selectedMode(modeGroup)
            val pairs = if (mode == BillMode.Export) {
                ExportBillType.entries.map { it.name to it.label }
            } else {
                ImportBillType.entries.map { it.name to it.label }
            }
            typeSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, pairs.map { it.second })
            typeSpinner.tag = pairs
            typeSpinner.setSelection(pairs.indexOfFirst { it.first == rule?.type }.takeIf { it >= 0 } ?: 0)
        }

        fun updateFrequencyFields() {
            val frequency = frequencyPairs[frequencySpinner.selectedItemPosition].first
            frequencyHint.text = when (frequency) {
                RecurringFrequency.Daily -> "每天生成时，只需要设置间隔。"
                RecurringFrequency.Weekly -> "每周生成时，需要设置间隔和周几。"
                RecurringFrequency.Monthly -> "每月生成时，需要设置间隔和几号。"
                RecurringFrequency.Yearly -> "每年生成时，需要设置间隔、月份和几号。"
            }
            weeklyBox.visibility = if (frequency == RecurringFrequency.Weekly) View.VISIBLE else View.GONE
            monthlyDayBox.visibility =
                if (frequency == RecurringFrequency.Monthly || frequency == RecurringFrequency.Yearly) View.VISIBLE else View.GONE
            yearlyMonthBox.visibility = if (frequency == RecurringFrequency.Yearly) View.VISIBLE else View.GONE
        }

        modeGroup.setOnCheckedChangeListener { _, _ -> refreshTypes() }
        frequencySpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                updateFrequencyFields()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }
        refreshTypes()
        updateFrequencyFields()

        box.addView(name)
        box.addView(enabled)
        box.addView(label("类型"))
        box.addView(modeGroup)
        box.addView(label("类别"))
        box.addView(typeSpinner)
        box.addView(amount)
        box.addView(label("周期"))
        box.addView(frequencySpinner)
        box.addView(frequencyHint)
        box.addView(intervalBox)
        box.addView(weeklyBox)
        box.addView(monthlyDayBox)
        box.addView(yearlyMonthBox)
        box.addView(label("开始日期"))
        box.addView(startButton)
        box.addView(label("结束日期"))
        box.addView(endButton)
        box.addView(clearEndButton)
        box.addView(remark)

        AlertDialog.Builder(this)
            .setTitle(if (rule == null) "新增周期记账" else "编辑周期记账")
            .setView(wrapDialogContent(box))
            .setPositiveButton("保存") { _, _ ->
                val value = amount.num()
                val ruleName = name.text.toString().trim()
                if (ruleName.isBlank() || value <= 0) {
                    toast("请输入名称和有效金额")
                    return@setPositiveButton
                }
                @Suppress("UNCHECKED_CAST")
                val typePairs = typeSpinner.tag as List<Pair<String, String>>
                val frequency = frequencyPairs[frequencySpinner.selectedItemPosition].first
                val intervalCount = interval.num().toInt().coerceAtLeast(1)
                val monthlyDay = dayOfMonth.num().toInt().coerceIn(1, 31)
                val weeklyDay = dayOfWeek.num().toInt().coerceIn(1, 7)
                val yearlyMonth = monthOfYear.num().toInt().coerceIn(1, 12)
                val nextRunDate = repository.nextRecurringDate(
                    frequency,
                    intervalCount,
                    maxDate(startDate, now),
                    if (frequency == RecurringFrequency.Monthly || frequency == RecurringFrequency.Yearly) monthlyDay else null,
                    if (frequency == RecurringFrequency.Weekly) weeklyDay else null,
                    if (frequency == RecurringFrequency.Yearly) yearlyMonth else null
                )
                val saved = RecurringBillRule(
                    id = rule?.id ?: 0,
                    name = ruleName,
                    enabled = enabled.isChecked,
                    mode = selectedMode(modeGroup),
                    amount = value,
                    type = typePairs[typeSpinner.selectedItemPosition].first,
                    remark = remark.text.toString(),
                    frequency = frequency,
                    intervalCount = intervalCount,
                    startDate = startDate,
                    endDate = endDate,
                    dayOfMonth = if (frequency == RecurringFrequency.Monthly || frequency == RecurringFrequency.Yearly) monthlyDay else null,
                    dayOfWeek = if (frequency == RecurringFrequency.Weekly) weeklyDay else null,
                    monthOfYear = if (frequency == RecurringFrequency.Yearly) yearlyMonth else null,
                    nextRunDate = nextRunDate,
                    lastRunDate = rule?.lastRunDate,
                    createdAt = rule?.createdAt ?: System.currentTimeMillis() / 1000,
                    updatedAt = System.currentTimeMillis() / 1000
                )
                if (rule == null) repository.createRecurringRule(saved) else repository.updateRecurringRule(saved)
                toast("已保存")
                showRecurringBills()
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun recurringText(rule: RecurringBillRule): String =
        when (rule.frequency) {
            RecurringFrequency.Daily -> "每 ${rule.intervalCount} 天"
            RecurringFrequency.Weekly -> "每 ${rule.intervalCount} 周 周${rule.dayOfWeek ?: rule.startDate.dayOfWeek.value}"
            RecurringFrequency.Monthly -> "每 ${rule.intervalCount} 月 ${rule.dayOfMonth ?: rule.startDate.dayOfMonth} 号"
            RecurringFrequency.Yearly -> "每 ${rule.intervalCount} 年 ${rule.monthOfYear ?: rule.startDate.monthValue} 月 ${rule.dayOfMonth ?: rule.startDate.dayOfMonth} 号"
        }

    private fun maxDate(a: LocalDate, b: LocalDate): LocalDate = if (a.isAfter(b)) a else b

    private fun dividerView(): View = View(this).apply {
        setBackgroundColor(Color.rgb(230, 233, 232))
        layoutParams = LinearLayout.LayoutParams(-1, dp(1)).apply {
            setMargins(0, dp(8), 0, dp(8))
        }
    }

    private fun showProfile() {
        currentTab = MainTab.Profile
        renderBottomNav()
        val page = page()
        page.addView(title("个人"))
        page.addView(card(verticalBox().apply {
            addView(sectionTitle("数据"))
            addView(primaryButton("导出 JSON") {
                startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "application/json"
                    putExtra(Intent.EXTRA_TITLE, defaultExportFileName())
                }, REQ_EXPORT_JSON)
            })
            addView(outlineButton("导入 JSON") {
                startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "application/json"
                }, REQ_IMPORT_JSON)
            })
        }))
        page.addView(card(verticalBox().apply {
            addView(sectionTitle("工具"))
            addView(outlineButton("工资计算") { showSalaryDialog() })
            addView(outlineButton("成都公积金计算") { showHousingFundDialog() })
            addView(outlineButton("房产计算") { showEstateDialog() })
        }))
        replace(page)
    }

    private fun showSalaryDialog() {
        val box = verticalBox()
        val base = input("月基础工资", "0", true)
        val subsidy = input("每月补贴", "0", true)
        val bonus = input("年终奖金额或月薪倍数", "0", true)
        val bonusAsMonths = CheckBox(this).apply { text = "年终奖按月薪倍数计算" }
        val extraAward = input("额外奖金", "0", true)
        val fundBase = input("社保/公积金基数", "0", true)
        val fundRate = input("公积金比例(%)", "12", true)
        val fundLimit = input("公积金上限基数", "3420", true)
        val specialDeduction = input("每月专项扣除", "1500", true)
        listOf(base, subsidy, bonus, bonusAsMonths, extraAward, fundBase, fundRate, fundLimit, specialDeduction).forEach { box.addView(it) }
        AlertDialog.Builder(this)
            .setTitle("工资计算")
            .setView(wrapDialogContent(box))
            .setPositiveButton("计算") { _, _ ->
                val yearAward = if (bonusAsMonths.isChecked) base.num() * bonus.num() else bonus.num()
                val result = SalaryCalculator.calculate(
                    SalaryInput(
                        base = base.num(),
                        monthlySubsidy = subsidy.num(),
                        yearAward = yearAward,
                        extraAward = extraAward.num(),
                        insuranceBase = fundBase.num(),
                        fundRatePercent = fundRate.num(),
                        fundLimitBase = fundLimit.num(),
                        specialDeduction = specialDeduction.num()
                    )
                )
                showResult("工资计算结果", """
                    税前年收入: ${money(result.beforeTaxYearSalary)}
                    每月五险: ${money(result.fiveInsurancesPerMonth)}
                    每月公积金: ${money(result.fundPerMonth)}
                    年个税: ${money(result.totalTax)}
                    税后年收入: ${money(result.afterTaxYearSalary)}
                """.trimIndent())
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun showHousingFundDialog() {
        val box = verticalBox()
        val rate = input("存贷系数", "0.9", true)
        val deposit = input("每月缴存", "0", true)
        val start = input("起始月份 YYYY-MM", YearMonth.now().minusMonths(11).toString())
        val end = input("结束月份 YYYY-MM", YearMonth.now().toString())
        val depositDetail = input("逐月缴存明细，逗号分隔(可选)", "")
        val withdrawDetail = input("逐月提取明细，逗号分隔(可选)", "")
        val couple = CheckBox(this).apply { text = "夫妻共同贷款" }
        val first = CheckBox(this).apply {
            text = "首套房"
            isChecked = true
        }
        listOf(rate, deposit, start, end, depositDetail, withdrawDetail, couple, first).forEach { box.addView(it) }
        AlertDialog.Builder(this)
            .setTitle("成都公积金计算")
            .setView(wrapDialogContent(box))
            .setPositiveButton("计算") { _, _ ->
                val months = monthDiff(start.text.toString(), end.text.toString()).coerceAtLeast(1)
                val detailed = calculateHousingFundDetail(rate.num(), depositDetail.text.toString(), withdrawDetail.text.toString())
                val result = if (detailed != null) {
                    val cityLimit = if (couple.isChecked) {
                        if (first.isChecked) 80.0 else 70.0
                    } else {
                        40.0
                    }
                    Triple(detailed / 10_000, cityLimit, min(detailed / 10_000, cityLimit))
                } else {
                    val simple = HousingFundCalculator.calculateChengdu(couple.isChecked, first.isChecked, rate.num(), deposit.num(), months)
                    Triple(simple.theoreticalLimit, simple.cityLimit, simple.finalLimit)
                }
                showResult("公积金计算结果", "理论上限: ${one(result.first)} 万\n城市上限: ${one(result.second)} 万\n可贷上限: ${one(result.third)} 万")
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun calculateHousingFundDetail(rate: Double, depositsText: String, withdrawText: String): Double? {
        val deposits = parseNumberList(depositsText)
        val withdraws = parseNumberList(withdrawText)
        if (deposits.isEmpty() || withdraws.isEmpty() || deposits.size != withdraws.size) return null
        var total = 0.0
        var toSubtract = 0.0
        var month = 1
        for (i in deposits.indices.reversed()) {
            var current = deposits[i]
            toSubtract += withdraws[i]
            if (toSubtract > current) {
                toSubtract -= current
                month++
                continue
            }
            current -= toSubtract
            toSubtract = 0.0
            total += rate * current * month
            month++
        }
        return if (toSubtract == 0.0) total else null
    }

    private fun showEstateDialog() {
        val box = verticalBox()
        val totalPrice = input("房屋总价", "0", true)
        val downRate = input("首付比例(如 0.3)", "0.3", true)
        val commercialAmount = input("商业贷款金额", "0", true)
        val commercialRate = input("商业贷款年利率(如 0.041)", "0.041", true)
        val commercialYears = input("商业贷款年限", "30", true)
        val fundAmount = input("公积金贷款金额", "0", true)
        val fundRate = input("公积金贷款年利率(如 0.031)", "0.031", true)
        val fundYears = input("公积金贷款年限", "30", true)
        val expectedRate = input("预期理财年化(如 0.04)", "0.04", true)
        val sellYears = input("几年后卖出", "5", true)
        val rent = input("每月房租", "0", true)
        val paymentType = RadioGroup(this).apply {
            orientation = RadioGroup.HORIZONTAL
            addView(radio("等额本息", PaymentType.EAPI.name, true))
            addView(radio("等额本金", PaymentType.EAP.name, false))
        }
        listOf(totalPrice, downRate, commercialAmount, commercialRate, commercialYears, fundAmount, fundRate, fundYears, expectedRate, sellYears, rent, paymentType).forEach { box.addView(it) }
        AlertDialog.Builder(this)
            .setTitle("房产计算")
            .setView(wrapDialogContent(box))
            .setPositiveButton("计算") { _, _ ->
                val loans = mutableListOf<Loan>()
                if (commercialAmount.num() > 0) loans.add(Loan(commercialAmount.num(), commercialRate.num(), commercialYears.num().toInt().coerceAtLeast(1)))
                if (fundAmount.num() > 0) loans.add(Loan(fundAmount.num(), fundRate.num(), fundYears.num().toInt().coerceAtLeast(1)))
                if (loans.isEmpty()) {
                    toast("请输入至少一项贷款")
                    return@setPositiveButton
                }
                val result = EstateCalculator.calculate(
                    EstateInput(
                        totalPrice = totalPrice.num(),
                        downPaymentRate = downRate.num(),
                        loans = loans,
                        paymentType = PaymentType.valueOf(selectedRadioTag(paymentType, PaymentType.EAPI.name)),
                        expectedRate = expectedRate.num(),
                        sellingYears = sellYears.num().toInt().coerceAtLeast(1),
                        rent = rent.num()
                    )
                )
                showResult("房产计算结果", """
                    首月月供: ${money(result.firstMonthPayment)}
                    持有期还款: ${money(result.accTotal)}
                    持有期利息: ${money(result.accInterest)}
                    已还本金: ${money(result.accPrincipal)}
                    剩余贷款: ${money(result.remainingLoan)}
                    租金累计: ${money(result.expectedInterest.totalRent)}
                    机会成本本金: ${money(result.expectedInterest.principal)}
                    机会成本收益: ${money(result.expectedInterest.diff)}
                    保本卖价: ${money(result.expectedSellingPrice)}
                """.trimIndent())
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun replace(view: View) {
        content.removeAllViews()
        if (view is LinearLayout) {
            content.addView(ScrollView(this).apply { addView(view) })
        } else {
            content.addView(view)
        }
    }

    private fun currentPeriodLabel(scope: StatsScope): String =
        when (scope) {
            StatsScope.Day -> "今天"
            StatsScope.Month -> "本月"
            StatsScope.Year -> "今年"
            StatsScope.All -> "本期"
        }

    private fun page(): LinearLayout = verticalBox().apply {
        setPadding(dp(16), dp(16), dp(16), dp(16))
    }

    private fun card(child: View): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(14), dp(12), dp(14), dp(12))
        background = rounded(Color.WHITE, dp(8).toFloat())
        addView(child)
        layoutParams = LinearLayout.LayoutParams(-1, -2).apply {
            setMargins(0, dp(8), 0, dp(8))
        }
        elevation = dp(1).toFloat()
    }

    private fun verticalBox(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
    }

    private fun title(value: String): TextView = TextView(this).apply {
        text = value
        textSize = 28f
        setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        setTextColor(TextMain)
        setPadding(0, dp(8), 0, dp(12))
    }

    private fun sectionTitle(value: String): TextView = TextView(this).apply {
        text = value
        textSize = 18f
        setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        setTextColor(Primary)
        setPadding(0, dp(6), 0, dp(6))
    }

    private fun label(value: String): TextView = TextView(this).apply {
        text = value
        textSize = 14f
        setTextColor(TextMuted)
        setPadding(0, dp(8), 0, dp(2))
    }

    private fun text(value: String, small: Boolean = false, weight: Float? = null): TextView = TextView(this).apply {
        text = value
        textSize = if (small) 13f else 16f
        setTextColor(if (small) TextMuted else TextMain)
        setPadding(0, dp(3), 0, dp(3))
        if (weight != null) layoutParams = LinearLayout.LayoutParams(0, -2, weight)
    }

    private fun metricRow(name: String, value: String, color: Int): View = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(0, dp(4), 0, dp(4))
        addView(text(name, weight = 1f))
        addView(text(value).apply {
            setTextColor(color)
            gravity = Gravity.END
        })
    }

    private fun summaryMetricRow(left: View, right: View): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(left, LinearLayout.LayoutParams(0, -2, 1f).apply {
                setMargins(0, dp(4), dp(8), dp(4))
            })
            addView(right, LinearLayout.LayoutParams(0, -2, 1f).apply {
                setMargins(dp(8), dp(4), 0, dp(4))
            })
        }

    private fun summaryMetric(name: String, value: String, color: Int): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(4), 0, dp(4))
            addView(text(name, small = true))
            addView(text(value).apply {
                textSize = 20f
                setTypeface(Typeface.DEFAULT, Typeface.BOLD)
                setTextColor(color)
            })
        }

    private fun input(hint: String, value: String = "", decimal: Boolean = false): EditText =
        EditText(this).apply {
            this.hint = hint
            setText(value)
            setSingleLine(true)
            textSize = 15f
            if (decimal) inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL or InputType.TYPE_NUMBER_FLAG_SIGNED
        }

    private fun radio(label: String, value: String, checked: Boolean): RadioButton =
        RadioButton(this).apply {
            id = View.generateViewId()
            text = label
            tag = value
            isChecked = checked
        }

    private fun primaryButton(label: String, action: (View) -> Unit): Button =
        Button(this).apply {
            text = label
            setTextColor(Color.WHITE)
            background = rounded(Primary, dp(6).toFloat())
            setOnClickListener(action)
            layoutParams = buttonParams()
        }

    private fun outlineButton(label: String, action: (View) -> Unit): Button =
        Button(this).apply {
            text = label
            setTextColor(Primary)
            background = roundedStroke(Color.TRANSPARENT, Primary)
            setOnClickListener(action)
            layoutParams = buttonParams()
        }

    private fun dangerButton(label: String, action: (View) -> Unit): Button =
        Button(this).apply {
            text = label
            setTextColor(Danger)
            background = roundedStroke(Color.TRANSPARENT, Danger)
            setOnClickListener(action)
            layoutParams = buttonParams()
        }

    private fun smallButton(label: String, action: () -> Unit): Button =
        outlineButton(label) { action() }.apply {
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(3), dp(4), dp(3), dp(4)) }
        }

    private fun primarySmallButton(label: String, action: () -> Unit): Button =
        primaryButton(label) { action() }.apply {
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(3), dp(4), dp(3), dp(4)) }
        }

    private fun periodButton(label: String, action: () -> Unit): Button =
        outlineButton(label) { action() }.apply {
            minWidth = 0
            minimumWidth = 0
            setPadding(dp(8), 0, dp(8), 0)
            layoutParams = LinearLayout.LayoutParams(if (label.length <= 1) dp(44) else dp(62), dp(40)).apply {
                setMargins(dp(3), 0, dp(3), 0)
            }
        }

    private fun buttonParams(): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(-1, dp(46)).apply { setMargins(0, dp(6), 0, dp(6)) }

    private fun rounded(color: Int, radius: Float): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius
        }

    private fun roundedStroke(color: Int, stroke: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(6).toFloat()
            setStroke(dp(1), stroke)
        }

    private fun wrapDialogContent(view: View): ScrollView =
        ScrollView(this).apply {
            addView(view, ViewGroup.LayoutParams(-1, -2))
            setPadding(dp(8), 0, dp(8), 0)
        }

    private fun selectedMode(group: RadioGroup): BillMode =
        BillMode.valueOf(selectedRadioTag(group, BillMode.Export.name))

    private fun selectedRadioTag(group: RadioGroup, fallback: String): String {
        val radio = group.findViewById<RadioButton>(group.checkedRadioButtonId)
        return radio?.tag?.toString() ?: fallback
    }

    private fun pickDate(initial: LocalDate, onPicked: (LocalDate) -> Unit) {
        DatePickerDialog(
            this,
            { _, year, month, day -> onPicked(LocalDate.of(year, month + 1, day)) },
            initial.year,
            initial.monthValue - 1,
            initial.dayOfMonth
        ).show()
    }

    private fun showResult(title: String, message: String) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("确定", null)
            .show()
    }

    private fun parseNumberList(value: String): List<Double> =
        value.split(',', '，', '\n', ';', '；')
            .mapNotNull { it.trim().takeIf { s -> s.isNotBlank() }?.toDoubleOrNull() }

    private fun monthDiff(start: String, end: String): Int =
        runCatching {
            val s = YearMonth.parse(start.trim())
            val e = YearMonth.parse(end.trim())
            (e.year - s.year) * 12 + e.monthValue - s.monthValue + 1
        }.getOrDefault(1)

    private fun defaultExportFileName(): String =
        "bookkeeping-${LocalDateTime.now().format(ExportFileNameFormatter)}.json"

    private fun toast(value: String) = Toast.makeText(this, value, Toast.LENGTH_SHORT).show()

    private fun money(value: Double): String = String.format(Locale.CHINA, "¥%.2f", value)

    private fun one(value: Double): String = String.format(Locale.CHINA, "%.1f", value)

    private fun two(value: Int): String = value.toString().padStart(2, '0')

    private fun EditText.num(): Double = text.toString().toDoubleOrNull() ?: 0.0

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    companion object {
        private const val REQ_IMPORT_JSON = 1001
        private const val REQ_EXPORT_JSON = 1002
        private const val DETAIL_LIMIT = 300
        private const val LARGEST_EXPENSE_LIMIT = 10
        private const val SEARCH_MODE_ALL = "All"
        private val Bg = Color.rgb(247, 248, 250)
        private val Primary = Color.rgb(30, 107, 92)
        private val TextMain = Color.rgb(36, 48, 44)
        private val TextMuted = Color.rgb(102, 112, 108)
        private val Good = Color.rgb(28, 128, 95)
        private val Danger = Color.rgb(196, 72, 72)
        private val ExportFileNameFormatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
        private val Palette = listOf(
            Color.rgb(30, 107, 92),
            Color.rgb(46, 125, 170),
            Color.rgb(224, 142, 58),
            Color.rgb(173, 89, 118),
            Color.rgb(95, 113, 188),
            Color.rgb(100, 135, 61),
            Color.rgb(176, 93, 64),
            Color.rgb(84, 128, 132)
        )
    }
}
