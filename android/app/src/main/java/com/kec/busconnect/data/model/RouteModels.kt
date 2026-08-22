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
    @SerializedName("sequence") val sequence: Int? = 1,
    @SerializedName("location") val location: GeoPointDto? = null,
    @SerializedName("latitude") val directLat: Double? = null,
    @SerializedName("longitude") val directLng: Double? = null,
    @SerializedName("lat") val shortLat: Double? = null,
    @SerializedName("lng") val shortLng: Double? = null,
    @SerializedName("landmark") val landmark: String? = null,
    @SerializedName("distanceFromOriginKm") val distanceFromOriginKm: Double? = null
) {
    val latitude: Double? get() = directLat ?: shortLat ?: location?.latitude
    val longitude: Double? get() = directLng ?: shortLng ?: location?.longitude
}
