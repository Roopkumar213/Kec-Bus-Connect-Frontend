package com.kec.busconnect.data.repository

import com.kec.busconnect.data.api.ApiService
import com.kec.busconnect.data.model.BusDto
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.RouteDto
import com.kec.busconnect.data.model.StopDto
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
                Result.success(getDefaultMdr87Route())
            }
        } catch (e: Exception) {
            Result.success(getDefaultMdr87Route())
        }
    }

    companion object {
        fun getDefaultMdr87Route(): RouteDto {
            val stops = listOf(
                StopDto(name = "Attikuppam (Origin)", sequence = 1, directLat = 12.884713, directLng = 78.479812, landmark = "Attikuppam Local Road", distanceFromOriginKm = 0.0),
                StopDto(name = "Manendram Village Stop", sequence = 2, directLat = 12.878439, directLng = 78.481943, landmark = "Ramakuppam-Attikuppam Road", distanceFromOriginKm = 0.8),
                StopDto(name = "Balaobanapalle Northern Junction", sequence = 3, directLat = 12.835211, directLng = 78.472352, landmark = "MDR87 Intersection", distanceFromOriginKm = 5.7),
                StopDto(name = "Singasamudram Center", sequence = 4, directLat = 12.833760, directLng = 78.503606, landmark = "MDR87 East Link", distanceFromOriginKm = 9.1),
                StopDto(name = "Kenchanaballa (Loop Terminus)", sequence = 5, directLat = 12.828577, directLng = 78.482298, landmark = "MDR87 Terminus track", distanceFromOriginKm = 11.8),
                StopDto(name = "Singasamudram (Return Pass-through)", sequence = 6, directLat = 12.833760, directLng = 78.503606, landmark = "MDR87 Westbound", distanceFromOriginKm = 14.5),
                StopDto(name = "Balaobanapalle Junction (Return Axis)", sequence = 7, directLat = 12.835211, directLng = 78.472352, landmark = "MDR87 / Vijalapuram Road split", distanceFromOriginKm = 17.9),
                StopDto(name = "Vijayapuram (Vijalapuram)", sequence = 8, directLat = 12.841468, directLng = 78.453880, landmark = "Vijalapuram Road", distanceFromOriginKm = 20.0),
                StopDto(name = "Aniganur (Sachivalayam Stop)", sequence = 9, directLat = 12.822435, directLng = 78.456689, landmark = "Govindapalle-Vijalapuram Track", distanceFromOriginKm = 22.2),
                StopDto(name = "Govindapalle", sequence = 10, directLat = 12.813177, directLng = 78.453880, landmark = "MDR87 Main Axis", distanceFromOriginKm = 23.3),
                StopDto(name = "Lingapuram", sequence = 11, directLat = 12.802100, directLng = 78.449500, landmark = "MDR87 Southern Corridor", distanceFromOriginKm = 24.6),
                StopDto(name = "Ramalagutta Chenu", sequence = 12, directLat = 12.783400, directLng = 78.441200, landmark = "MDR87 Rural Section", distanceFromOriginKm = 26.8),
                StopDto(name = "Kangundhi", sequence = 13, directLat = 12.768058, directLng = 78.432970, landmark = "MDR87 Heritage Valley Corridor", distanceFromOriginKm = 28.7),
                StopDto(name = "Dase Gownur Crossing", sequence = 14, directLat = 12.752300, directLng = 78.388100, landmark = "Kuppam Approach Road", distanceFromOriginKm = 33.7),
                StopDto(name = "Kuppam Town Center", sequence = 15, directLat = 12.739798, directLng = 78.345572, landmark = "Central Urban Arterial", distanceFromOriginKm = 38.3),
                StopDto(name = "Kuppam Engineering College (KEC - Terminus)", sequence = 16, directLat = 12.721662, directLng = 78.360311, landmark = "KES Nagar College Campus Road", distanceFromOriginKm = 39.8)
            )

            return RouteDto(
                id = "route-mdr87",
                routeNumber = "MDR87",
                name = "Attikuppam → KEC (via MDR87)",
                origin = "Attikuppam (Origin)",
                destination = "Kuppam Engineering College (KEC)",
                stops = stops,
                isActive = true
            )
        }

        fun getDefaultBusStatus(busNumber: String = "KEC-07"): LiveBusStatusDto {
            return LiveBusStatusDto(
                busId = busNumber,
                busNumber = busNumber,
                registrationNumber = "AP-39-TJ-2026",
                status = "RUNNING",
                freshness = "LIVE",
                latitude = 12.884713,
                longitude = 78.479812,
                accuracy = 8.0,
                speed = 32.0,
                heading = 180.0,
                lastUpdated = null,
                secondsSinceLastUpdate = 0L,
                currentlyAtStop = "Attikuppam (Origin)",
                previousStop = null,
                nextStop = "Manendram Village Stop",
                distanceToNextStopKm = 0.8,
                etaMinutesToNextStop = 2.0,
                activeTripId = null,
                passengerRequestActive = false,
                direction = "MORNING",
                startingPoint = "Attikuppam (Origin)",
                destination = "Kuppam Engineering College (KEC)",
                sourceType = "STUDENT"
            )
        }
    }
}
