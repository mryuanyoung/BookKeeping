package com.mryuanyoung.bookkeeping.data

import android.util.Base64
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class WebDavClient(
    private val baseUrl: String,
    private val username: String,
    private val password: String
) {
    private val authHeader = "Basic " + Base64.encodeToString("$username:$password".toByteArray(), Base64.NO_WRAP)

    fun uploadBackup(json: String): String {
        val name = "bookkeeping-${LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))}.json"
        val connection = open("$baseUrl/$name", "PUT")
        connection.outputStream.use { it.write(json.toByteArray()) }
        val code = connection.responseCode
        if (code !in 200..299) error("WebDAV backup failed: HTTP $code")
        return name
    }

    fun download(filename: String): String {
        val connection = open("$baseUrl/$filename", "GET")
        val code = connection.responseCode
        if (code !in 200..299) error("WebDAV download failed: HTTP $code")
        return connection.inputStream.bufferedReader().use { it.readText() }
    }

    private fun open(url: String, method: String): HttpURLConnection {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.setRequestProperty("Authorization", authHeader)
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
        connection.connectTimeout = 10_000
        connection.readTimeout = 20_000
        connection.doInput = true
        connection.doOutput = method == "PUT"
        return connection
    }
}
