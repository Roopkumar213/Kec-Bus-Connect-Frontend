package com.kec.busconnect.data.repository

import com.kec.busconnect.data.api.ApiService
import com.kec.busconnect.data.model.BusDto
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.RouteDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for Bus and Route details, live telemetry status, and routes list.
 */
class BusRepository(private val apiService: ApiService) {

    suspend fun getActiveBuses(): Result<List<BusDto>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getActiveBuses()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch buses: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLiveBusStatus(busId: String): Result<LiveBusStatusDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getLiveBusStatus(busId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Live telemetry unavailable: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBusDetails(busId: String): Result<BusDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getBusDetails(busId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch bus details: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getRoutes(): Result<List<RouteDto>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getRoutes()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load routes: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getRouteById(routeId: String): Result<RouteDto> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getRouteById(routeId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load route: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
