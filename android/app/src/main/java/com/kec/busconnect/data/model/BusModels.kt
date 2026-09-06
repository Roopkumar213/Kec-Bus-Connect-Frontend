package com.kec.busconnect.data.model

import com.google.gson.annotations.SerializedName

/**
 * Bus and Live Telemetry Data Models.
 */
data class BusDto(
    @SerializedName("id") val id: String,
    @SerializedName("busNumber") val busNumber: String,
    @SerializedName("registrationNumber") val registrationNumber: String?,
    @SerializedName("routeId") val routeId: String?,
    @SerializedName("trackerId") val trackerId: String?,
    @SerializedName("status") val status: String? = "NOT_STARTED",
    @SerializedName("active") val isActive: Boolean = true,
    @SerializedName("route") val route: RouteDto? = null
)

data class LiveBusStatusDto(
    @SerializedName("busId") val busId: String?,
    @SerializedName("busNumber") val busNumber: String?,
    @SerializedName("registrationNumber") val registrationNumber: String?,
    @SerializedName("status") val status: String?,
    @SerializedName("freshness") val freshness: String?, // LIVE, STALE, LOCATION_DELAYED
    @SerializedName("latitude") val latitude: Double?,
    @SerializedName("longitude") val longitude: Double?,
    @SerializedName("accuracy") val accuracy: Double?,
    @SerializedName("speed") val speed: Double?,
    @SerializedName("heading") val heading: Double?,
    @SerializedName("lastUpdated") val lastUpdated: String?,
    @SerializedName("secondsSinceLastUpdate") val secondsSinceLastUpdate: Long?,
    @SerializedName("currentlyAtStop") val currentlyAtStop: String?,
    @SerializedName("previousStop") val previousStop: String?,
    @SerializedName("nextStop") val nextStop: String?,
    @SerializedName("distanceToNextStopKm") val distanceToNextStopKm: Double?,
    @SerializedName("etaMinutesToNextStop") val etaMinutesToNextStop: Double?,
    @SerializedName("activeTripId") val activeTripId: String?,
    @SerializedName("passengerRequestActive") val passengerRequestActive: Boolean = false,
    @SerializedName("direction") val direction: String? = "MORNING", // MORNING, EVENING
    @SerializedName("startingPoint") val startingPoint: String?,
    @SerializedName("destination") val destination: String?,
    @SerializedName("sourceType") val sourceType: String? // DRIVER, ADMIN, STUDENT
)
