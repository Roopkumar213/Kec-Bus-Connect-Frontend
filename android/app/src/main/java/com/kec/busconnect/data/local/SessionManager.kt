package com.kec.busconnect.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import com.kec.busconnect.data.model.StudentDto
import com.kec.busconnect.data.model.UserDto

/**
 * SessionManager handles secure storage of JWT Auth Token,
 * logged-in User details, and Student profile using EncryptedSharedPreferences with fallback.
 */
class SessionManager(context: Context) {

    private val gson = Gson()
    private val prefs: SharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "kec_busconnect_secure_session",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        // Fallback to standard SharedPreferences if Keystore is unavailable on older test devices
        context.getSharedPreferences("kec_busconnect_session_fallback", Context.MODE_PRIVATE)
    }

    companion object {
        private const val KEY_JWT_TOKEN = "jwt_token"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_DATA = "user_data"
        private const val KEY_STUDENT_DATA = "student_data"
        private const val KEY_ACTIVE_SHARING_BUS_ID = "active_sharing_bus_id"
    }

    fun saveAuthSession(token: String, user: UserDto, student: StudentDto? = null) {
        prefs.edit().apply {
            putString(KEY_JWT_TOKEN, token)
            putString(KEY_USER_ROLE, user.role.uppercase())
            putString(KEY_USER_EMAIL, user.email)
            putString(KEY_USER_DATA, gson.toJson(user))
            if (student != null) {
                putString(KEY_STUDENT_DATA, gson.toJson(student))
            }
            apply()
        }
    }

    fun getToken(): String? = prefs.getString(KEY_JWT_TOKEN, null)

    fun getUserRole(): String? = prefs.getString(KEY_USER_ROLE, null)

    fun getUserEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)

    fun getUser(): UserDto? {
        val json = prefs.getString(KEY_USER_DATA, null) ?: return null
        return try { gson.fromJson(json, UserDto::class.java) } catch (e: Exception) { null }
    }

    fun getStudent(): StudentDto? {
        val json = prefs.getString(KEY_STUDENT_DATA, null) ?: return null
        return try { gson.fromJson(json, StudentDto::class.java) } catch (e: Exception) { null }
    }

    fun saveStudent(student: StudentDto) {
        prefs.edit().putString(KEY_STUDENT_DATA, gson.toJson(student)).apply()
    }

    fun isLoggedIn(): Boolean = !getToken().isNullOrBlank()

    fun setActiveSharingBusId(busId: String?) {
        prefs.edit().putString(KEY_ACTIVE_SHARING_BUS_ID, busId).apply()
    }

    fun getActiveSharingBusId(): String? = prefs.getString(KEY_ACTIVE_SHARING_BUS_ID, null)

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
