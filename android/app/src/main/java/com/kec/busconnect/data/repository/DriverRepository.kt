package com.kec.busconnect.data.repository

import com.kec.busconnect.data.api.ApiService
import com.kec.busconnect.data.model.PassengerSummaryDto
import com.kec.busconnect.data.model.TripDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for Driver trip lifecycle, active trip lookup, and passenger summaries.
 */
class DriverRepository(private val apiService: ApiService) {

    suspend fun startTrip(busId: String, direction: String): Result<TripDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.startDriverTrip(mapOf("busId" to busId, "direction" to direction))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to start trip: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun stopTrip(tripId: String): Result<TripDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.stopDriverTrip(tripId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to stop trip: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getActiveTrip(busId: String): Result<TripDto?> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getActiveDriverTrip(busId)
            when {
                response.isSuccessful -> Result.success(response.body())
                response.code() == 204 || response.code() == 404 -> Result.success(null) // No active trip
                else -> Result.failure(Exception("Active trip query failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestPassengerConfirmation(tripId: String): Result<TripDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.requestPassengerConfirmation(tripId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Request passenger check failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPassengerSummary(tripId: String): Result<PassengerSummaryDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPassengerSummary(tripId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch passenger summary: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
