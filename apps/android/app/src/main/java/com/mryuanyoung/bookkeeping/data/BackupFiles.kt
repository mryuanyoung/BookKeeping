package com.mryuanyoung.bookkeeping.data

import android.content.Context
import java.io.File
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class BackupFiles(private val context: Context) {
    private val formatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")

    fun exportToFile(json: String): File {
        val file = File(context.getExternalFilesDir(null), "bookkeeping-${LocalDateTime.now().format(formatter)}.json")
        file.writeText(json)
        return file
    }

    fun importFromFile(path: String): String = File(path).readText()
}
