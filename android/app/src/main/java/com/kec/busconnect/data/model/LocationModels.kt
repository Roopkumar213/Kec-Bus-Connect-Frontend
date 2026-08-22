package com.kec.busconnect.data.model

import com.google.gson.annotations.SerializedName

/**
 * Location Telemetry and Sharing Status Models.
 */
data class LocationUpdateRequest(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Double? = null,
    @SerializedName("speed") val speed: Double? = null,
    @SerializedName("heading") val heading: Double? = null
)

data class BusLocationResponseDto(
    @SerializedName("busNumber") val busNumber: String?,
    @SerializedName("status") val status: String?,
    @SerializedName("location") val location: LatLngDto?,
    @SerializedName("accuracy") val accuracy: Double?,
    @SerializedName("speed") val speed: Double?,
    @SerializedName("heading") val heading: Double?,
    @SerializedName("updatedAt") val updatedAt: String?
)

data class LatLngDto(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)

data class LocationShareStatusDto(
    @SerializedName("busId") val busId: String?,
    @SerializedName("busNumber") val busNumber: String?,
    @SerializedName("activeTripExists") val activeTripExists: Boolean = false,
    @SerializedName("currentSource") val currentSource: String?, // DRIVER, ADMIN, STUDENT, null
    @SerializedName("isCurrentSource") val isCurrentSource: Boolean = false,
    @SerializedName("canStudentShare") val canStudentShare: Boolean = false
)

data class ApiResponseDto(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("message") val message: String? = null
)
