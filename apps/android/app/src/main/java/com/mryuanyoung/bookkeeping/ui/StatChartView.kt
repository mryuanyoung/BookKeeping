package com.mryuanyoung.bookkeeping.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.view.View
import java.util.Locale

enum class ChartMode { Pie, Bar }

data class ChartEntry(
    val label: String,
    val value: Double,
    val color: Int
)

class StatChartView(context: Context) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(36, 48, 44)
        textSize = 32f
    }
    private var entries: List<ChartEntry> = emptyList()
    private var mode: ChartMode = ChartMode.Pie

    fun setData(entries: List<ChartEntry>, mode: ChartMode) {
        this.entries = entries.filter { it.value > 0 }
        this.mode = mode
        invalidate()
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        setMeasuredDimension(width, (260 * resources.displayMetrics.density).toInt())
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (entries.isEmpty()) {
            canvas.drawText("暂无图表数据", 24f, height / 2f, textPaint)
            return
        }
        when (mode) {
            ChartMode.Pie -> drawPie(canvas)
            ChartMode.Bar -> drawBar(canvas)
        }
    }

    private fun drawPie(canvas: Canvas) {
        val diameter = minOf(width * 0.42f, height * 0.72f)
        val left = 28f
        val top = (height - diameter) / 2f
        val rect = RectF(left, top, left + diameter, top + diameter)
        val total = entries.sumOf { it.value }.toFloat()
        var start = -90f
        entries.forEach { entry ->
            paint.color = entry.color
            val sweep = (entry.value.toFloat() / total) * 360f
            canvas.drawArc(rect, start, sweep, true, paint)
            start += sweep
        }
        var y = 48f
        val legendX = left + diameter + 34f
        entries.take(6).forEach { entry ->
            paint.color = entry.color
            canvas.drawRect(legendX, y - 22f, legendX + 22f, y, paint)
            canvas.drawText("${entry.label} ${money(entry.value)}", legendX + 34f, y, textPaint)
            y += 40f
        }
    }

    private fun drawBar(canvas: Canvas) {
        val chartLeft = 36f
        val chartTop = 24f
        val chartBottom = height - 54f
        val chartWidth = width - chartLeft - 24f
        val max = entries.maxOf { it.value }.coerceAtLeast(1.0)
        val barGap = 8f
        val barWidth = (chartWidth - barGap * (entries.size - 1)) / entries.size
        entries.forEachIndexed { index, entry ->
            val left = chartLeft + index * (barWidth + barGap)
            val barHeight = ((entry.value / max) * (chartBottom - chartTop)).toFloat()
            paint.color = entry.color
            canvas.drawRoundRect(left, chartBottom - barHeight, left + barWidth, chartBottom, 8f, 8f, paint)
            textPaint.textAlign = Paint.Align.CENTER
            textPaint.textSize = 24f
            canvas.drawText(entry.label, left + barWidth / 2, chartBottom + 30f, textPaint)
        }
        textPaint.textAlign = Paint.Align.LEFT
        textPaint.textSize = 28f
        canvas.drawText("最高 ${money(max)}", chartLeft, chartTop + 18f, textPaint)
    }

    private fun money(value: Double): String = String.format(Locale.CHINA, "%.0f", value)
}
