package com.kec.busconnect.data.repository

import com.kec.busconnect.data.api.ApiService
import com.kec.busconnect.data.model.BusDto
import com.kec.busconnect.data.model.StudentDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for Admin dashboard statistics, students, and buses.
 */
class AdminRepository(private val apiService: ApiService) {

    suspend fun getAdminStudents(): Result<List<StudentDto>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAdminStudents()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch students: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAdminBuses(): Result<List<BusDto>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAdminBuses()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch buses: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAdminStats(): Result<Map<String, Any>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAdminStats()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch stats: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
