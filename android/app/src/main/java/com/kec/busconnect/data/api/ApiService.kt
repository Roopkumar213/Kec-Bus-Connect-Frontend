package com.kec.busconnect.data.api

import com.kec.busconnect.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit interface covering all existing Spring Boot REST endpoints.
 */
interface ApiService {

    // ==========================================
    // 1. Authentication APIs
    // ==========================================
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/student/signup")
    suspend fun signup(@Body request: SignupRequestDto): Response<ApiResponseDto>

    @GET("auth/me")
    suspend fun getMe(): Response<MeResponseDto>

    // ==========================================
    // 2. Bus & Tracking Public APIs
    // ==========================================
    @GET("buses")
    suspend fun getActiveBuses(): Response<List<BusDto>>

    @GET("buses/{busId}")
    suspend fun getBusDetails(@Path("busId") busId: String): Response<BusDto>

    @GET("buses/{busId}/live")
    suspend fun getLiveBusStatus(@Path("busId") busId: String): Response<LiveBusStatusDto>

    @GET("buses/{busId}/location")
    suspend fun getBusLocation(@Path("busId") busId: String): Response<BusLocationResponseDto>

    @POST("buses/{busId}/location")
    suspend fun updateBusLocation(
        @Path("busId") busId: String,
        @Body request: LocationUpdateRequest
    ): Response<BusLocationResponseDto>

    // ==========================================
    // 3. Route APIs
    // ==========================================
    @GET("routes")
    suspend fun getRoutes(): Response<List<RouteDto>>

    @GET("routes/{routeId}")
    suspend fun getRouteById(@Path("routeId") routeId: String): Response<RouteDto>

    // ==========================================
    // 4. Student APIs
    // ==========================================
    @GET("students/me")
    suspend fun getMyStudentProfile(): Response<StudentDto>

    @PUT("students/me")
    suspend fun updateMyStudentProfile(@Body student: StudentDto): Response<StudentDto>

    @GET("student/location/status")
    suspend fun getLocationShareStatus(@Query("busId") busId: String): Response<LocationShareStatusDto>

    @POST("student/location/stop")
    suspend fun stopStudentLocationSharing(@Query("busId") busId: String): Response<ApiResponseDto>

    @POST("student/trips/{tripId}/confirm")
    suspend fun confirmOnBus(@Path("tripId") tripId: String): Response<PassengerConfirmationDto>

    @POST("student/trips/{tripId}/not-on-bus")
    suspend fun notOnBus(@Path("tripId") tripId: String): Response<PassengerConfirmationDto>

    @PUT("student/boarding-location")
    suspend fun updateBoardingLocation(@Body request: BoardingLocationRequest): Response<StudentDto>

    // ==========================================
    // 5. Driver APIs
    // ==========================================
    @POST("driver/trips/start")
    suspend fun startDriverTrip(@Body body: Map<String, String>): Response<TripDto>

    @POST("driver/trips/{tripId}/stop")
    suspend fun stopDriverTrip(@Path("tripId") tripId: String): Response<TripDto>

    @GET("driver/trips/active/{busId}")
    suspend fun getActiveDriverTrip(@Path("busId") busId: String): Response<TripDto>

    @POST("driver/trips/{tripId}/passenger-request")
    suspend fun requestPassengerConfirmation(@Path("tripId") tripId: String): Response<TripDto>

    @GET("driver/trips/{tripId}/passengers")
    suspend fun getPassengerSummary(@Path("tripId") tripId: String): Response<PassengerSummaryDto>

    // ==========================================
    // 6. Admin APIs
    // ==========================================
    @GET("admin/students")
    suspend fun getAdminStudents(): Response<List<StudentDto>>

    @GET("admin/buses")
    suspend fun getAdminBuses(): Response<List<BusDto>>
}
