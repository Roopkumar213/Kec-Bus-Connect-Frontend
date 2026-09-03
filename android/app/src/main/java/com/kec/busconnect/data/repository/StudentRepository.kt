package com.kec.busconnect.data.repository

import com.kec.busconnect.data.api.ApiService
import com.kec.busconnect.data.local.SessionManager
import com.kec.busconnect.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository handling Student profile, location sharing authorization, and boarding confirmations.
 */
class StudentRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {

    suspend fun getMyProfile(): Result<StudentDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyStudentProfile()
            if (response.isSuccessful && response.body() != null) {
                val student = response.body()!!
                sessionManager.saveStudent(student)
                Result.success(student)
            } else {
                Result.failure(Exception("Failed to fetch profile: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLocationShareStatus(busId: String): Result<LocationShareStatusDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getLocationShareStatus(busId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to check share status: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun stopLocationSharing(busId: String): Result<ApiResponseDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.stopStudentLocationSharing(busId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to stop sharing: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun confirmOnBus(tripId: String): Result<PassengerConfirmationDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.confirmOnBus(tripId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Confirmation failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun notOnBus(tripId: String): Result<PassengerConfirmationDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.notOnBus(tripId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Status update failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateBoardingLocation(lat: Double, lng: Double): Result<StudentDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.updateBoardingLocation(BoardingLocationRequest(lat, lng))
            if (response.isSuccessful && response.body() != null) {
                val student = response.body()!!
                sessionManager.saveStudent(student)
                Result.success(student)
            } else {
                Result.failure(Exception("Failed to update boarding location: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(student: StudentDto): Result<StudentDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.updateMyStudentProfile(student)
            if (response.isSuccessful && response.body() != null) {
                val updated = response.body()!!
                sessionManager.saveStudent(updated)
                Result.success(updated)
            } else {
                Result.failure(Exception("Failed to update profile: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
