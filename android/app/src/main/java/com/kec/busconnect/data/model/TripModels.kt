package com.kec.busconnect.data.model

import com.google.gson.annotations.SerializedName

/**
 * Trip and Passenger Confirmation Models.
 */
data class TripDto(
    @SerializedName("id") val id: String,
    @SerializedName("busId") val busId: String,
    @SerializedName("routeId") val routeId: String?,
    @SerializedName("driverId") val driverId: String?,
    @SerializedName("status") val status: String, // SCHEDULED, ACTIVE, COMPLETED, CANCELLED
    @SerializedName("direction") val direction: String? = "MORNING", // MORNING, EVENING
    @SerializedName("passengerRequestActive") val isPassengerRequestActive: Boolean = false,
    @SerializedName("lastLocation") val lastLocation: GeoPointDto?,
    @SerializedName("lastSpeed") val lastSpeed: Double?,
    @SerializedName("passengerConfirmations") val passengerConfirmations: List<PassengerConfirmationDto> = emptyList()
)

data class PassengerConfirmationDto(
    @SerializedName("studentId") val studentId: String,
    @SerializedName("status") val status: String, // NOT_ON_BUS, CONFIRMED_ON_BUS
    @SerializedName("confirmedAt") val confirmedAt: String?
)

data class PassengerSummaryDto(
    @SerializedName("totalAssigned") val totalAssigned: Int = 0,
    @SerializedName("confirmedOnBus") val confirmedOnBus: Int = 0,
    @SerializedName("notOnBus") val notOnBus: Int = 0,
    @SerializedName("pending") val pending: Int = 0
)

data class BoardingLocationRequest(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Double? = 10.0
)
