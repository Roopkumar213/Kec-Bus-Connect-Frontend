package com.kec.busconnect.data.model

import com.google.gson.annotations.SerializedName

/**
 * Auth Data Models matching Spring Boot backend contracts.
 */
data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("token") val token: String?,
    @SerializedName("user") val user: UserDto?,
    @SerializedName("student") val student: StudentDto?,
    @SerializedName("message") val message: String?
)

data class UserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("role") val role: String,
    @SerializedName("active") val isActive: Boolean = true
)

data class StudentDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("fullName") val fullName: String? = null,
    @SerializedName("studentId") val studentId: String? = null,
    @SerializedName("mobile") val mobile: String? = null,
    @SerializedName("collegeType") val collegeType: String? = null,
    @SerializedName("program") val program: String? = null,
    @SerializedName("department") val department: String? = null,
    @SerializedName("academicYear") val academicYear: Int? = null,
    @SerializedName("section") val section: String? = null,
    @SerializedName("batch") val batch: String? = null,
    @SerializedName("boardingLocation") val boardingLocation: GeoPointDto? = null,
    @SerializedName("eveningDropLocation") val eveningDropLocation: GeoPointDto? = null,
    @SerializedName("eveningDropAddress") val eveningDropAddress: String? = null,
    @SerializedName("reminderMinutes") val reminderMinutes: Int? = 10,
    @SerializedName("assignedRoute") val assignedRoute: String? = null,
    @SerializedName("assignedBus") val assignedBus: String? = null
)

data class GeoPointDto(
    @SerializedName("type") val type: String = "Point",
    @SerializedName("coordinates") val coordinates: List<Double> = emptyList() // [lng, lat]
) {
    val latitude: Double? get() = if (coordinates.size >= 2) coordinates[1] else null
    val longitude: Double? get() = if (coordinates.size >= 2) coordinates[0] else null
}
