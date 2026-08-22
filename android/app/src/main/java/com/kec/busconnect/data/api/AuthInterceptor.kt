package com.kec.busconnect.data.api

import com.kec.busconnect.data.local.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Interceptor that attaches the Bearer JWT token to every outgoing HTTP request.
 */
class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = sessionManager.getToken()

        val newRequestBuilder = originalRequest.newBuilder()
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")

        if (!token.isNullOrBlank()) {
            newRequestBuilder.header("Authorization", "Bearer $token")
        }

        val response = chain.proceed(newRequestBuilder.build())

        // If backend returns 401 Unauthorized for an authenticated endpoint, clean up session
        if (response.code == 401 && !token.isNullOrBlank()) {
            val path = originalRequest.url.encodedPath
            if (!path.contains("/auth/login") && !path.contains("/auth/student/signup")) {
                sessionManager.clearSession()
            }
        }

        return response
    }
}
