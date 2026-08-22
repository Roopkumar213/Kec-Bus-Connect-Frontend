package com.kec.busconnect.data.repository

import com.kec.busconnect.data.api.ApiService
import com.kec.busconnect.data.local.SessionManager
import com.kec.busconnect.data.model.LoginRequest
import com.kec.busconnect.data.model.LoginResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository managing authentication, login, session caching, and logout.
 */
class AuthRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {

    suspend fun login(email: String, pass: String): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(LoginRequest(email.trim(), pass.trim()))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && !body.token.isNullOrBlank() && body.user != null) {
                    sessionManager.saveAuthSession(body.token, body.user, body.student)
                    Result.success(body)
                } else {
                    Result.failure(Exception(body.message ?: "Invalid credentials"))
                }
            } else {
                val errorMsg = when (response.code()) {
                    401 -> "Invalid email or password."
                    403 -> "Your account is disabled or you do not have permission."
                    404 -> "Authentication service not found."
                    500 -> "Internal server error. Please try again later."
                    else -> "Login failed (${response.code()})"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: java.net.ConnectException) {
            Result.failure(Exception("Cannot connect to server. Check your internet."))
        } catch (e: java.net.SocketTimeoutException) {
            Result.failure(Exception("Connection timed out. Please try again."))
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.localizedMessage ?: "Unable to connect"}"))
        }
    }

    fun isLoggedIn(): Boolean = sessionManager.isLoggedIn()

    fun getUserRole(): String? = sessionManager.getUserRole()

    fun getStudent() = sessionManager.getStudent()

    fun logout() {
        sessionManager.clearSession()
    }
}
