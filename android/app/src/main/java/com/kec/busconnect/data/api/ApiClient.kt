package com.kec.busconnect.data.api

import android.content.Context
import com.kec.busconnect.BuildConfig
import com.kec.busconnect.data.local.SessionManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton factory providing configured Retrofit API service.
 * Supports configurable Base URLs for Local LAN, Emulator, and Production.
 */
object ApiClient {

    // Production Render backend URL
    const val PRODUCTION_BASE_URL = "https://kec-bus-connect-backend.onrender.com/api/"

    // Local Android Emulator URL
    const val EMULATOR_DEV_BASE_URL = "http://10.0.2.2:8081/api/"

    @Volatile
    private var customBaseUrl: String? = null

    @Volatile
    private var instance: ApiService? = null

    /**
     * Allows setting a custom Base URL at runtime (e.g. for testing on a real phone with computer's LAN IP).
     * Example: ApiClient.setCustomBaseUrl("http://192.168.1.100:8081/api/")
     */
    fun setCustomBaseUrl(url: String?) {
        val sanitized = if (!url.isNullOrBlank() && !url.endsWith("/")) "$url/" else url
        if (customBaseUrl != sanitized) {
            customBaseUrl = sanitized
            instance = null // Invalidate existing instance so new Retrofit is built
        }
    }

    fun getBaseUrl(): String {
        return customBaseUrl ?: if (BuildConfig.DEBUG) EMULATOR_DEV_BASE_URL else PRODUCTION_BASE_URL
    }

    fun getService(context: Context): ApiService {
        return instance ?: synchronized(this) {
            instance ?: buildApiService(context).also { instance = it }
        }
    }

    private fun buildApiService(context: Context): ApiService {
        val sessionManager = SessionManager(context.applicationContext)

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(sessionManager))
            .addInterceptor(loggingInterceptor)
            .connectTimeout(25, TimeUnit.SECONDS)
            .readTimeout(25, TimeUnit.SECONDS)
            .writeTimeout(25, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

        return Retrofit.Builder()
            .baseUrl(getBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
