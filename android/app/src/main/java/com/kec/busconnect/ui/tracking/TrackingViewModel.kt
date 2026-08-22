package com.kec.busconnect.ui.tracking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.LocationShareStatusDto
import com.kec.busconnect.data.model.RouteDto
import com.kec.busconnect.data.model.StopDto
import com.kec.busconnect.data.repository.BusRepository
import com.kec.busconnect.data.repository.StudentRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.*

data class TrackingUiState(
    val isLoading: Boolean = false,
    val busNumber: String = "KEC-07",
    val liveStatus: LiveBusStatusDto? = BusRepository.getDefaultBusStatus("KEC-07"),
    val route: RouteDto? = BusRepository.getDefaultMdr87Route(),
    val stops: List<StopDto> = BusRepository.getDefaultMdr87Route().stops,
    val selectedStop: StopDto? = BusRepository.getDefaultMdr87Route().stops.lastOrNull(),
    val distanceToSelectedStopKm: Double? = 39.8,
    val etaMinutesToSelectedStop: Double? = 75.0,
    val arrivalAlert: String? = null,
    val selectedDirection: String = "MORNING", // MORNING, EVENING
    val shareStatus: LocationShareStatusDto? = null,
    val isSharingLocationLocally: Boolean = false,
    val shareError: String? = null,
    val isBoarded: Boolean = false,
    val errorMessage: String? = null
)

class TrackingViewModel(
    private val busRepository: BusRepository,
    private val studentRepository: StudentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TrackingUiState())
    val uiState: StateFlow<TrackingUiState> = _uiState.asStateFlow()

    private var pollingJob: Job? = null

    init {
        // Compute initial metrics
        recalculateProximity()
    }

    fun startTracking(busNumber: String) {
        _uiState.value = _uiState.value.copy(busNumber = busNumber)
        
        // Start 5-second polling loop
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                fetchTelemetry(busNumber)
                fetchShareEligibility(busNumber)
                delay(5000L) // 5 seconds interval
            }
        }
    }

    fun selectStop(stopName: String) {
        val stop = _uiState.value.stops.find { it.name == stopName } ?: return
        _uiState.value = _uiState.value.copy(selectedStop = stop)
        recalculateProximity()
    }

    fun setDirection(direction: String) {
        val rawStops = _uiState.value.route?.stops ?: BusRepository.getDefaultMdr87Route().stops
        val sortedStops = rawStops.sortedBy { it.sequence ?: 0 }
        val orderedStops = if (direction == "EVENING") sortedStops.reversed() else sortedStops
        
        _uiState.value = _uiState.value.copy(
            selectedDirection = direction,
            stops = orderedStops,
            selectedStop = orderedStops.firstOrNull()
        )
        recalculateProximity()
    }

    fun confirmBoarding() {
        _uiState.value = _uiState.value.copy(isBoarded = true)
        viewModelScope.launch {
            try {
                val activeTripId = _uiState.value.liveStatus?.activeTripId
                if (!activeTripId.isNullOrBlank()) {
                    studentRepository.confirmOnBus(activeTripId)
                }
            } catch (ignored: Exception) {}
        }
    }

    private suspend fun fetchTelemetry(busNumber: String) {
        val result = busRepository.getLiveBusStatus(busNumber)
        result.onSuccess { live ->
            if (_uiState.value.route == null) {
                loadRouteDetails(busNumber)
            }

            val currentDirection = live.direction ?: _uiState.value.selectedDirection
            val rawStops = _uiState.value.route?.stops ?: BusRepository.getDefaultMdr87Route().stops
            val sortedStops = rawStops.sortedBy { it.sequence ?: 0 }
            val stopsList = if (currentDirection == "EVENING") sortedStops.reversed() else sortedStops

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                liveStatus = live,
                stops = stopsList,
                selectedDirection = currentDirection,
                errorMessage = null
            )
            recalculateProximity()
        }.onFailure { err ->
            // In case backend is offline, preserve local fallback data gracefully
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = null // Keep clean UI with cached/fallback route
            )
            recalculateProximity()
        }
    }

    private fun recalculateProximity() {
        val live = _uiState.value.liveStatus ?: return
        val stop = _uiState.value.selectedStop ?: return

        val busLat = live.latitude ?: 12.884713
        val busLng = live.longitude ?: 78.479812
        val stopLat = stop.latitude ?: return
        val stopLng = stop.longitude ?: return

        val distKm = calculateDistanceKm(busLat, busLng, stopLat, stopLng)
        val speedKmh = if ((live.speed ?: 0.0) > 5.0) live.speed!! else 30.0 // Default 30 km/h average
        val etaMin = (distKm / speedKmh) * 60.0

        val alert = if (distKm <= 2.0 || etaMin <= 10.0) {
            "⚠️ Bus ${_uiState.value.busNumber} is approaching ${stop.name} (~${String.format("%.1f", distKm)} km, ~${etaMin.toInt()} min)"
        } else null

        _uiState.value = _uiState.value.copy(
            distanceToSelectedStopKm = distKm,
            etaMinutesToSelectedStop = etaMin,
            arrivalAlert = alert
        )
    }

    private fun calculateDistanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0 // Earth radius in km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }

    private suspend fun loadRouteDetails(busId: String) {
        val busResult = busRepository.getBusDetails(busId)
        busResult.onSuccess { bus ->
            val routeId = bus.routeId ?: "route-mdr87"
            val routeResult = busRepository.getRouteById(routeId)
            routeResult.onSuccess { r ->
                val sortedStops = r.stops.sortedBy { it.sequence ?: 0 }
                _uiState.value = _uiState.value.copy(
                    route = r,
                    stops = if (_uiState.value.selectedDirection == "EVENING") sortedStops.reversed() else sortedStops
                )
                recalculateProximity()
            }
        }.onFailure {
            val defaultR = BusRepository.getDefaultMdr87Route()
            _uiState.value = _uiState.value.copy(
                route = defaultR,
                stops = defaultR.stops
            )
            recalculateProximity()
        }
    }

    private suspend fun fetchShareEligibility(busNumber: String) {
        val result = studentRepository.getLocationShareStatus(busNumber)
        result.onSuccess { status ->
            _uiState.value = _uiState.value.copy(shareStatus = status)
        }
    }

    fun setLocalSharingState(sharing: Boolean, errorMsg: String? = null) {
        _uiState.value = _uiState.value.copy(
            isSharingLocationLocally = sharing,
            shareError = errorMsg
        )
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}

