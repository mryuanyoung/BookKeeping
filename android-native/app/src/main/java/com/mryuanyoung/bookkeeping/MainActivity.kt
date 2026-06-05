package com.mryuanyoung.bookkeeping

import android.app.Activity
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.*
import com.mryuanyoung.bookkeeping.calc.*
import com.mryuanyoung.bookkeeping.data.*
import java.io.File
import java.time.LocalDate
import java.util.Locale

class MainActivity : Activity() {
    private lateinit var repository: BookkeepingRepository
    private lateinit var backupFiles: BackupFiles
    private lateinit var content: FrameLayout
    private var editingBill: Bill? = null
    private var selectedDate: LocalDate = LocalDate.now()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = BookkeepingRepository(this)
        backupFiles = BackupFiles(this)
        buildShell()
        showRecord()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_IMPORT_JSON && resultCode == RESULT_OK) {
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
    }

    private fun buildShell() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFFF7F8FA.toInt())
        }
        content = FrameLayout(this)
        root.addView(content, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(bottomNav())
        setContentView(root)
    }

    private fun bottomNav(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        setBackgroundColor(0xFFFFFFFF.toInt())
        addView(navButton("记账") { showRecord() })
        addView(navButton("账单") { showAccount() })
        addView(navButton("个人") { showProfile() })
    }

    private fun navButton(text: String, action: () -> Unit): Button =
        Button(this).apply {
            this.text = text
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(0, dp(56), 1f)
        }

    private fun showRecord() {
        val scroll = page()
        scroll.addView(title("记一笔"))
        val form = billForm { showRecord() }
        scroll.addView(form)
        scroll.addView(sectionTitle("今天"))
        scroll.addView(billList(repository.findByDay(LocalDate.now()), allowEdit = true))
        replace(scroll)
    }

    private fun billForm(afterSave: () -> Unit): View {
        val bill = editingBill
        val box = verticalBox()
        val modeGroup = RadioGroup(this).apply {
            orientation = RadioGroup.HORIZONTAL
            addView(radio("支出", BillMode.Export.name, bill?.mode != BillMode.Import))
            addView(radio("收入", BillMode.Import.name, bill?.mode == BillMode.Import))
        }
        val typeSpinner = Spinner(this)
        val amount = input("金额", bill?.amount?.toString().orEmpty(), decimal = true)
        val remark = input("备注", bill?.remark.orEmpty())
        selectedDate = bill?.date ?: LocalDate.now()
        val dateButton = Button(this).apply {
            text = selectedDate.toString()
            setOnClickListener {
                DatePickerDialog(
                    this@MainActivity,
                    { _, year, month, day ->
                        selectedDate = LocalDate.of(year, month + 1, day)
                        text = selectedDate.toString()
                    },
                    selectedDate.year,
                    selectedDate.monthValue - 1,
                    selectedDate.dayOfMonth
                ).show()
            }
        }

        fun refreshTypes() {
            val mode = selectedMode(modeGroup)
            val labels = if (mode == BillMode.Export) {
                ExportBillType.entries.map { it.name to it.label }
            } else {
                ImportBillType.entries.map { it.name to it.label }
            }
            typeSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, labels.map { it.second })
            val selected = labels.indexOfFirst { it.first == bill?.type }.takeIf { it >= 0 } ?: 0
            typeSpinner.setSelection(selected)
            typeSpinner.tag = labels
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
        box.addView(Button(this).apply {
            text = if (bill == null) "记账" else "保存修改"
            setOnClickListener {
                val value = amount.text.toString().toDoubleOrNull() ?: 0.0
                if (value <= 0) {
                    toast("请输入有效金额")
                    return@setOnClickListener
                }
                val mode = selectedMode(modeGroup)
                val pairs = typeSpinner.tag as List<Pair<String, String>>
                val target = Bill(
                    id = bill?.id ?: 0,
                    mode = mode,
                    amount = value,
                    type = pairs[typeSpinner.selectedItemPosition].first,
                    remark = remark.text.toString(),
                    date = selectedDate,
                    unix = bill?.unix ?: System.currentTimeMillis() / 1000
                )
                if (bill == null) repository.create(target) else repository.update(target)
                editingBill = null
                toast("已保存")
                afterSave()
            }
        })
        if (bill != null) {
            box.addView(Button(this).apply {
                text = "取消编辑"
                setOnClickListener {
                    editingBill = null
                    afterSave()
                }
            })
            box.addView(Button(this).apply {
                text = "删除"
                setOnClickListener {
                    repository.delete(bill.id)
                    editingBill = null
                    toast("已删除")
                    afterSave()
                }
            })
        }
        return card(box)
    }

    private fun showAccount() {
        val scroll = page()
        scroll.addView(title("账单"))
        val filterBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(smallButton("日") { showBills("day") })
            addView(smallButton("月") { showBills("month") })
            addView(smallButton("年") { showBills("year") })
            addView(smallButton("总") { showBills("all") })
        }
        scroll.addView(filterBar)
        addBillSummary(scroll, repository.findByMonth(LocalDate.now().year, LocalDate.now().monthValue), "本月概览")
        scroll.addView(billList(repository.findByMonth(LocalDate.now().year, LocalDate.now().monthValue), allowEdit = true))
        replace(scroll)
    }

    private fun showBills(scope: String) {
        val now = LocalDate.now()
        val bills = when (scope) {
            "day" -> repository.findByDay(now)
            "month" -> repository.findByMonth(now.year, now.monthValue)
            "year" -> repository.findByYear(now.year)
            else -> repository.findAll()
        }
        val scroll = page()
        scroll.addView(title(when (scope) {
            "day" -> "今日账单"
            "month" -> "本月账单"
            "year" -> "本年账单"
            else -> "总账单"
        }))
        addBillSummary(scroll, bills, "统计")
        scroll.addView(categoryStats(bills))
        scroll.addView(billList(bills, allowEdit = true))
        replace(scroll)
    }

    private fun addBillSummary(scroll: LinearLayout, bills: List<Bill>, heading: String) {
        val summary = repository.summary(bills)
        scroll.addView(card(verticalBox().apply {
            addView(sectionTitle(heading))
            addView(text("收入: ${money(summary.income)}"))
            addView(text("支出: ${money(summary.expense)}"))
            addView(text("结余: ${money(summary.balance)}"))
            addView(text("笔数: ${summary.count}"))
        }))
    }

    private fun categoryStats(bills: List<Bill>): View {
        val box = verticalBox()
        box.addView(sectionTitle("支出分类"))
        val stats = repository.categorySummary(bills, BillMode.Export)
        if (stats.isEmpty()) box.addView(text("暂无支出")) else stats.forEach {
            box.addView(text("${it.label}: ${money(it.amount)}"))
        }
        return card(box)
    }

    private fun billList(bills: List<Bill>, allowEdit: Boolean): View {
        val box = verticalBox()
        if (bills.isEmpty()) {
            box.addView(text("暂无记录"))
            return card(box)
        }
        bills.forEach { bill ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(0, dp(8), 0, dp(8))
                addView(text("${bill.date}  ${bill.typeLabel}  ${if (bill.mode == BillMode.Export) "-" else "+"}${money(bill.amount)}"))
                if (bill.remark.isNotBlank()) addView(text(bill.remark, small = true))
                if (allowEdit) setOnClickListener {
                    editingBill = bill
                    showRecord()
                }
            }
            box.addView(row)
        }
        return card(box)
    }

    private fun showProfile() {
        val scroll = page()
        scroll.addView(title("个人"))
        scroll.addView(card(verticalBox().apply {
            addView(sectionTitle("数据"))
            addView(Button(this@MainActivity).apply {
                text = "导出 JSON"
                setOnClickListener {
                    val file = backupFiles.exportToFile(repository.exportJson())
                    toast("已导出: ${file.absolutePath}")
                }
            })
            addView(Button(this@MainActivity).apply {
                text = "导入 JSON"
                setOnClickListener {
                    startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "application/json"
                    }, REQ_IMPORT_JSON)
                }
            })
            addView(Button(this@MainActivity).apply {
                text = "WebDAV 设置/同步"
                setOnClickListener { showWebDavDialog() }
            })
        }))
        scroll.addView(card(verticalBox().apply {
            addView(sectionTitle("工具"))
            addView(Button(this@MainActivity).apply {
                text = "工资计算"
                setOnClickListener { showSalaryDialog() }
            })
            addView(Button(this@MainActivity).apply {
                text = "成都公积金计算"
                setOnClickListener { showHousingFundDialog() }
            })
            addView(Button(this@MainActivity).apply {
                text = "房产计算"
                setOnClickListener { showEstateDialog() }
            })
        }))
        replace(scroll)
    }

    private fun showWebDavDialog() {
        val prefs = getSharedPreferences("webdav", MODE_PRIVATE)
        val box = verticalBox()
        val baseUrl = input("WebDAV 地址", prefs.getString("baseUrl", "").orEmpty())
        val username = input("用户名", prefs.getString("username", "").orEmpty())
        val password = input("密码", prefs.getString("password", "").orEmpty())
        val filename = input("下载文件名", "")
        box.addView(baseUrl)
        box.addView(username)
        box.addView(password)
        box.addView(filename)
        AlertDialog.Builder(this)
            .setTitle("WebDAV")
            .setView(box)
            .setPositiveButton("备份") { _, _ ->
                prefs.edit()
                    .putString("baseUrl", baseUrl.text.toString().trimEnd('/'))
                    .putString("username", username.text.toString())
                    .putString("password", password.text.toString())
                    .apply()
                runNetwork("备份成功") {
                    WebDavClient(baseUrl.text.toString().trimEnd('/'), username.text.toString(), password.text.toString())
                        .uploadBackup(repository.exportJson())
                }
            }
            .setNegativeButton("下载导入") { _, _ ->
                runNetwork("导入成功") {
                    val json = WebDavClient(baseUrl.text.toString().trimEnd('/'), username.text.toString(), password.text.toString())
                        .download(filename.text.toString())
                    repository.importJson(json)
                }
            }
            .setNeutralButton("取消", null)
            .show()
    }

    private fun showSalaryDialog() {
        val box = verticalBox()
        val base = input("月基础工资", "0", true)
        val subsidy = input("每月补贴", "0", true)
        val yearAward = input("年终奖", "0", true)
        val extraAward = input("额外奖金", "0", true)
        val fundBase = input("社保/公积金基数", "0", true)
        val fundRate = input("公积金比例(%)", "12", true)
        val fundLimit = input("公积金上限基数", "3420", true)
        listOf(base, subsidy, yearAward, extraAward, fundBase, fundRate, fundLimit).forEach { box.addView(it) }
        AlertDialog.Builder(this)
            .setTitle("工资计算")
            .setView(box)
            .setPositiveButton("计算") { _, _ ->
                val result = SalaryCalculator.calculate(
                    SalaryInput(
                        base = base.num(),
                        monthlySubsidy = subsidy.num(),
                        yearAward = yearAward.num(),
                        extraAward = extraAward.num(),
                        insuranceBase = fundBase.num(),
                        fundRatePercent = fundRate.num(),
                        fundLimitBase = fundLimit.num()
                    )
                )
                showResult(
                    "工资计算结果",
                    """
                    税前年收入: ${money(result.beforeTaxYearSalary)}
                    每月五险: ${money(result.fiveInsurancesPerMonth)}
                    每月公积金: ${money(result.fundPerMonth)}
                    年个税: ${money(result.totalTax)}
                    税后年收入: ${money(result.afterTaxYearSalary)}
                    """.trimIndent()
                )
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun showHousingFundDialog() {
        val box = verticalBox()
        val rate = input("存贷系数", "0.9", true)
        val deposit = input("每月缴存", "0", true)
        val months = input("缴存月数", "12", true)
        val couple = CheckBox(this).apply { text = "夫妻共同贷款" }
        val first = CheckBox(this).apply {
            text = "首套房"
            isChecked = true
        }
        listOf(rate, deposit, months, couple, first).forEach { box.addView(it) }
        AlertDialog.Builder(this)
            .setTitle("成都公积金计算")
            .setView(box)
            .setPositiveButton("计算") { _, _ ->
                val result = HousingFundCalculator.calculateChengdu(couple.isChecked, first.isChecked, rate.num(), deposit.num(), months.num().toInt())
                showResult(
                    "公积金计算结果",
                    "理论上限: ${one(result.theoreticalLimit)} 万\n城市上限: ${one(result.cityLimit)} 万\n可贷上限: ${one(result.finalLimit)} 万"
                )
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun showEstateDialog() {
        val box = verticalBox()
        val totalPrice = input("房屋总价", "0", true)
        val downRate = input("首付比例(如 0.3)", "0.3", true)
        val loanAmount = input("贷款金额", "0", true)
        val annualRate = input("贷款年利率(如 0.041)", "0.041", true)
        val duration = input("贷款年限", "30", true)
        val expectedRate = input("预期理财年化(如 0.04)", "0.04", true)
        val sellYears = input("几年后卖出", "5", true)
        val rent = input("每月房租", "0", true)
        listOf(totalPrice, downRate, loanAmount, annualRate, duration, expectedRate, sellYears, rent).forEach { box.addView(it) }
        AlertDialog.Builder(this)
            .setTitle("房产计算")
            .setView(box)
            .setPositiveButton("计算") { _, _ ->
                val result = EstateCalculator.calculate(
                    EstateInput(
                        totalPrice = totalPrice.num(),
                        downPaymentRate = downRate.num(),
                        loans = listOf(Loan(loanAmount.num(), annualRate.num(), duration.num().toInt())),
                        paymentType = PaymentType.EAPI,
                        expectedRate = expectedRate.num(),
                        sellingYears = sellYears.num().toInt(),
                        rent = rent.num()
                    )
                )
                showResult(
                    "房产计算结果",
                    """
                    首月月供: ${money(result.firstMonthPayment)}
                    持有期还款: ${money(result.accTotal)}
                    持有期利息: ${money(result.accInterest)}
                    已还本金: ${money(result.accPrincipal)}
                    剩余贷款: ${money(result.remainingLoan)}
                    机会成本本金: ${money(result.expectedInterest.principal)}
                    机会成本收益: ${money(result.expectedInterest.diff)}
                    保本卖价: ${money(result.expectedSellingPrice)}
                    """.trimIndent()
                )
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun replace(view: View) {
        content.removeAllViews()
        if (view is LinearLayout) {
            val scroll = ScrollView(this)
            scroll.addView(view)
            content.addView(scroll)
        } else {
            content.addView(view)
        }
    }

    private fun page(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(16))
        }
    }

    private fun card(child: View): View = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(14), dp(12), dp(14), dp(12))
        setBackgroundColor(0xFFFFFFFF.toInt())
        addView(child)
        layoutParams = LinearLayout.LayoutParams(-1, -2).apply {
            setMargins(0, dp(8), 0, dp(8))
        }
    }

    private fun verticalBox(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
    }

    private fun title(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 28f
        setTextColor(0xFF17201D.toInt())
        setPadding(0, dp(8), 0, dp(12))
    }

    private fun sectionTitle(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 18f
        setTextColor(0xFF1E6B5C.toInt())
        setPadding(0, dp(6), 0, dp(6))
    }

    private fun label(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 14f
        setTextColor(0xFF5C6662.toInt())
        setPadding(0, dp(8), 0, dp(2))
    }

    private fun text(text: String, small: Boolean = false): TextView = TextView(this).apply {
        this.text = text
        textSize = if (small) 13f else 16f
        setTextColor(if (small) 0xFF66706C.toInt() else 0xFF24302C.toInt())
        setPadding(0, dp(3), 0, dp(3))
    }

    private fun input(hint: String, value: String = "", decimal: Boolean = false): EditText =
        EditText(this).apply {
            this.hint = hint
            setText(value)
            setSingleLine(true)
            if (decimal) inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
        }

    private fun radio(label: String, value: String, checked: Boolean): RadioButton =
        RadioButton(this).apply {
            text = label
            tag = value
            isChecked = checked
        }

    private fun smallButton(label: String, action: () -> Unit): Button =
        Button(this).apply {
            text = label
            setOnClickListener { action() }
            layoutParams = LinearLayout.LayoutParams(0, dp(48), 1f)
        }

    private fun selectedMode(group: RadioGroup): BillMode {
        val radio = group.findViewById<RadioButton>(group.checkedRadioButtonId)
        return BillMode.valueOf(radio.tag.toString())
    }

    private fun runNetwork(success: String, task: () -> Unit) {
        Thread {
            runCatching { task() }
                .onSuccess { runOnUiThread { toast(success) } }
                .onFailure { runOnUiThread { toast(it.message ?: "操作失败") } }
        }.start()
    }

    private fun showResult(title: String, message: String) {
        AlertDialog.Builder(this).setTitle(title).setMessage(message).setPositiveButton("确定", null).show()
    }

    private fun toast(text: String) = Toast.makeText(this, text, Toast.LENGTH_SHORT).show()

    private fun money(value: Double): String = String.format(Locale.CHINA, "¥%.2f", value)

    private fun one(value: Double): String = String.format(Locale.CHINA, "%.1f", value)

    private fun EditText.num(): Double = text.toString().toDoubleOrNull() ?: 0.0

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    companion object {
        private const val REQ_IMPORT_JSON = 1001
    }
}
