package com.kec.busconnect.data.repository

import com.kec.busconnect.data.api.ApiService
import com.kec.busconnect.data.model.BusDto
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.RouteDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for Bus and Route details, live telemetry status, and routes list.
 * Communicates directly with the Spring Boot backend.
 */
class BusRepository(private val apiService: ApiService) {

    suspend fun getActiveBuses(): Result<List<BusDto>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getActiveBuses()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Unable to load active buses (${response.code()})"))
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
                Result.failure(Exception("Live telemetry unavailable for $busId (${response.code()})"))
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
                Result.failure(Exception("Bus details unavailable (${response.code()})"))
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
                Result.failure(Exception("Failed to load routes (${response.code()})"))
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
                Result.failure(Exception("Route details not found (${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    companion object {
        fun getDefaultMdr87Route(): RouteDto {
            return RouteDto(
                id = "route-mdr87-1",
                name = "Attikuppam → KEC (via MDR87)",
                routeNumber = "R-01",
                origin = "Attikuppam",
                destination = "Kuppam Engineering College (KEC - Terminus)",
                stops = listOf(
                    com.kec.busconnect.data.model.StopDto(name = "Attikuppam (Origin)", sequence = 1, directLat = 12.884713, directLng = 78.479812, landmark = "Attikuppam Local Road"),
                    com.kec.busconnect.data.model.StopDto(name = "Manendram Village Stop", sequence = 2, directLat = 12.878439, directLng = 78.481943, landmark = "Ramakuppam-Attikuppam Road"),
                    com.kec.busconnect.data.model.StopDto(name = "Balaobanapalle Northern Junction", sequence = 3, directLat = 12.835211, directLng = 78.472352, landmark = "MDR87 Intersection"),
                    com.kec.busconnect.data.model.StopDto(name = "Singasamudram Center", sequence = 4, directLat = 12.833760, directLng = 78.503606, landmark = "MDR87 East Link"),
                    com.kec.busconnect.data.model.StopDto(name = "Kenchanaballa (Loop Terminus)", sequence = 5, directLat = 12.828577, directLng = 78.482298, landmark = "MDR87 Terminus track"),
                    com.kec.busconnect.data.model.StopDto(name = "Singasamudram (Return Pass-through)", sequence = 6, directLat = 12.833760, directLng = 78.503606, landmark = "MDR87 Westbound"),
                    com.kec.busconnect.data.model.StopDto(name = "Balaobanapalle Junction (Return Axis)", sequence = 7, directLat = 12.835211, directLng = 78.472352, landmark = "MDR87 / Vijalapuram Road split"),
                    com.kec.busconnect.data.model.StopDto(name = "Vijayapuram (Vijalapuram)", sequence = 8, directLat = 12.841468, directLng = 78.453880, landmark = "Vijalapuram Road"),
                    com.kec.busconnect.data.model.StopDto(name = "Aniganur (Sachivalayam Stop)", sequence = 9, directLat = 12.822435, directLng = 78.456689, landmark = "Govindapalle-Vijalapuram Track"),
                    com.kec.busconnect.data.model.StopDto(name = "Govindapalle", sequence = 10, directLat = 12.813177, directLng = 78.453880, landmark = "MDR87 Main Axis"),
                    com.kec.busconnect.data.model.StopDto(name = "Lingapuram", sequence = 11, directLat = 12.802100, directLng = 78.449500, landmark = "MDR87 Southern Corridor"),
                    com.kec.busconnect.data.model.StopDto(name = "Ramalagutta Chenu", sequence = 12, directLat = 12.783400, directLng = 78.441200, landmark = "MDR87 Rural Section"),
                    com.kec.busconnect.data.model.StopDto(name = "Kangundhi", sequence = 13, directLat = 12.768058, directLng = 78.432970, landmark = "MDR87 Heritage Valley Corridor"),
                    com.kec.busconnect.data.model.StopDto(name = "Dase Gownur Crossing", sequence = 14, directLat = 12.752300, directLng = 78.388100, landmark = "Kuppam Approach Road"),
                    com.kec.busconnect.data.model.StopDto(name = "Kuppam Town Center", sequence = 15, directLat = 12.739798, directLng = 78.345572, landmark = "Central Urban Arterial"),
                    com.kec.busconnect.data.model.StopDto(name = "Kuppam Engineering College (KEC - Terminus)", sequence = 16, directLat = 12.721662, directLng = 78.360311, landmark = "KES Nagar College Campus Road")
                )
            )
        }
    }
}
