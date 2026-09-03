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

                    // If student, proactively fetch and cache profile
                    if (body.user.role.equals("STUDENT", ignoreCase = true)) {
                        try {
                            val profileRes = apiService.getMyStudentProfile()
                            if (profileRes.isSuccessful && profileRes.body() != null) {
                                sessionManager.saveStudent(profileRes.body()!!)
                            }
                        } catch (e: Exception) {
                            // Non-fatal, profile will be fetched on dashboard entry
                        }
                    }

                    Result.success(body)
                } else {
                    Result.failure(Exception(body.message ?: "Incorrect email or password."))
                }
            } else {
                val errorMsg = when (response.code()) {
                    400 -> "Invalid request. Please check your credentials."
                    401 -> "Incorrect email or password."
                    403 -> "Account is disabled or lacks permission."
                    404 -> "Authentication endpoint not found on server."
                    500, 502, 503 -> "Server error. Please try again in a few moments."
                    else -> "Login failed (${response.code()})"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: java.net.ConnectException) {
            Result.failure(Exception("Unable to connect to the server. Check your internet connection."))
        } catch (e: java.net.SocketTimeoutException) {
            Result.failure(Exception("Server connection timed out. Please check server availability."))
        } catch (e: java.net.UnknownHostException) {
            Result.failure(Exception("Server hostname could not be resolved. Check internet."))
        } catch (e: Exception) {
            Result.failure(Exception("Unable to connect to server: ${e.localizedMessage ?: "Network error"}"))
        }
    }

    fun isLoggedIn(): Boolean = sessionManager.isLoggedIn()

    fun getUserRole(): String? = sessionManager.getUserRole()

    fun getStudent() = sessionManager.getStudent()

    fun getUser() = sessionManager.getUser()

    fun logout() {
        sessionManager.clearSession()
    }
}
