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
 */
object ApiClient {

    // Production Render backend URL
    private const val PRODUCTION_BASE_URL = "https://kec-bus-connect-backend.onrender.com/api/"

    // Local Android Emulator testing URL
    private const val DEV_BASE_URL = "http://10.0.2.2:8081/api/"

    private val baseUrl: String
        get() = if (BuildConfig.DEBUG) DEV_BASE_URL else PRODUCTION_BASE_URL

    @Volatile
    private var instance: ApiService? = null

    fun getService(context: Context): ApiService {
        return instance ?: synchronized(this) {
            instance ?: buildApiService(context).also { instance = it }
        }
    }

    private fun buildApiService(context: Context): ApiService {
        val sessionManager = SessionManager(context.applicationContext)

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(sessionManager))
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
