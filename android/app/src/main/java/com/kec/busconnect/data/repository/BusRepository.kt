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
                destination = "Kuppam Engineering College (KEC)",
                stops = listOf(
                    com.kec.busconnect.data.model.StopDto(name = "Attikuppam (Origin)", sequence = 1, directLat = 12.884713, directLng = 78.479812, landmark = "Origin Point"),
                    com.kec.busconnect.data.model.StopDto(name = "Nekkundi", sequence = 2, directLat = 12.871050, directLng = 78.470500, landmark = "Village Junction"),
                    com.kec.busconnect.data.model.StopDto(name = "Nekkundi Cross", sequence = 3, directLat = 12.862300, directLng = 78.462800, landmark = "MDR87 Checkpost"),
                    com.kec.busconnect.data.model.StopDto(name = "Pedda Vankadoddi", sequence = 4, directLat = 12.853000, directLng = 78.455200, landmark = "Gram Panchayat"),
                    com.kec.busconnect.data.model.StopDto(name = "Chinna Vankadoddi", sequence = 5, directLat = 12.846500, directLng = 78.448900, landmark = "Bus Shelter"),
                    com.kec.busconnect.data.model.StopDto(name = "Kangundhi Cross", sequence = 6, directLat = 12.839800, directLng = 78.441000, landmark = "Fort Arch"),
                    com.kec.busconnect.data.model.StopDto(name = "Kangundhi Village", sequence = 7, directLat = 12.831500, directLng = 78.432000, landmark = "Historic Palace Road"),
                    com.kec.busconnect.data.model.StopDto(name = "Bisanatham Cross", sequence = 8, directLat = 12.822000, directLng = 78.421500, landmark = "State Highway Link"),
                    com.kec.busconnect.data.model.StopDto(name = "Bisanatham Railway Gate", sequence = 9, directLat = 12.812500, directLng = 78.411000, landmark = "Level Crossing"),
                    com.kec.busconnect.data.model.StopDto(name = "Settipalli", sequence = 10, directLat = 12.802000, directLng = 78.399500, landmark = "Temple Junction"),
                    com.kec.busconnect.data.model.StopDto(name = "Gudupalli", sequence = 11, directLat = 12.791500, directLng = 78.388000, landmark = "Town Bus Stand"),
                    com.kec.busconnect.data.model.StopDto(name = "Gudupalli Police Station", sequence = 12, directLat = 12.783000, directLng = 78.379000, landmark = "Main Circle"),
                    com.kec.busconnect.data.model.StopDto(name = "Yamagandlapalli", sequence = 13, directLat = 12.771000, directLng = 78.368500, landmark = "MDR87 Curve"),
                    com.kec.busconnect.data.model.StopDto(name = "Peddabangarunatham", sequence = 14, directLat = 12.759000, directLng = 78.358000, landmark = "Sub Post Office"),
                    com.kec.busconnect.data.model.StopDto(name = "KEC Main Gate", sequence = 15, directLat = 12.748500, directLng = 78.349000, landmark = "Campus Entrance"),
                    com.kec.busconnect.data.model.StopDto(name = "KEC Admin Block", sequence = 16, directLat = 12.744120, directLng = 78.344890, landmark = "Final Destination")
                )
            )
        }
    }
}
