package com.kec.busconnect.data.model

import com.google.gson.annotations.SerializedName

/**
 * Route and Stop Data Models.
 */
data class RouteDto(
    @SerializedName("id") val id: String,
    @SerializedName("routeNumber") val routeNumber: String?,
    @SerializedName("name") val name: String?,
    @SerializedName("origin") val origin: String?,
    @SerializedName("destination") val destination: String?,
    @SerializedName("stops") val stops: List<StopDto> = emptyList(),
    @SerializedName("active") val isActive: Boolean = true
)

data class StopDto(
    @SerializedName("name") val name: String,
    @SerializedName("sequence") val sequence: Int?,
    @SerializedName("location") val location: GeoPointDto?,
    @SerializedName("distanceFromOriginKm") val distanceFromOriginKm: Double?
) {
    val latitude: Double? get() = location?.latitude
    val longitude: Double? get() = location?.longitude
}
