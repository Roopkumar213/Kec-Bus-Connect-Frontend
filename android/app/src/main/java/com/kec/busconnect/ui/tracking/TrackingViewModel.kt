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
    val isLoading: Boolean = true,
    val busNumber: String = "KEC-07",
    val liveStatus: LiveBusStatusDto? = null,
    val route: RouteDto? = null,
    val stops: List<StopDto> = emptyList(),
    val selectedStop: StopDto? = null,
    val distanceToSelectedStopKm: Double? = null,
    val etaMinutesToSelectedStop: Double? = null,
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

    fun startTracking(busNumber: String) {
        _uiState.value = _uiState.value.copy(busNumber = busNumber, isLoading = true, errorMessage = null)

        viewModelScope.launch {
            loadRouteDetails(busNumber)
            fetchTelemetry(busNumber)
            fetchShareEligibility(busNumber)
        }

        // Start 5-second polling loop
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(5000L)
                fetchTelemetry(busNumber)
                fetchShareEligibility(busNumber)
            }
        }
    }

    fun selectStop(stopName: String) {
        val stop = _uiState.value.stops.find { it.name == stopName } ?: return
        _uiState.value = _uiState.value.copy(selectedStop = stop)
        recalculateProximity()
    }

    fun setDirection(direction: String) {
        val rawStops = _uiState.value.route?.stops ?: emptyList()
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
            // Load route first if not loaded yet (await it, don't race)
            if (_uiState.value.route == null) {
                loadRouteDetails(busNumber)
            }

            val currentDirection = live.direction ?: _uiState.value.selectedDirection
            val rawStops = _uiState.value.route?.stops ?: emptyList()
            val sortedStops = rawStops.sortedBy { it.sequence ?: 0 }
            val stopsList = if (currentDirection == "EVENING") sortedStops.reversed() else sortedStops

            // Only update stops if we actually have some now (don't overwrite with empty list)
            val finalStops = if (stopsList.isNotEmpty()) stopsList else _uiState.value.stops

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                liveStatus = live,
                stops = finalStops,
                selectedStop = _uiState.value.selectedStop ?: finalStops.firstOrNull(),
                selectedDirection = currentDirection,
                errorMessage = null
            )
            recalculateProximity()
        }.onFailure { err ->
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = if (_uiState.value.liveStatus == null) "Bus telemetry unavailable (${err.message})" else null
            )
            recalculateProximity()
        }
    }

    private fun recalculateProximity() {
        val live = _uiState.value.liveStatus ?: return
        val stop = _uiState.value.selectedStop ?: return

        val busLat = live.latitude ?: return
        val busLng = live.longitude ?: return
        val stopLat = stop.latitude ?: return
        val stopLng = stop.longitude ?: return

        val distKm = calculateDistanceKm(busLat, busLng, stopLat, stopLng)
        val speedKmh = if ((live.speed ?: 0.0) > 5.0) live.speed!! else 30.0 // Default 30 km/h average
        val etaMin = (distKm / speedKmh) * 60.0

        val alert = if (distKm <= 2.0 || etaMin <= 10.0) {
            "⚠️ Bus ${_uiState.value.busNumber} is approaching ${stop.name} (~${String.format(java.util.Locale.US, "%.1f", distKm)} km, ~${etaMin.toInt()} min)"
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
            if (bus.route != null && bus.route.stops.isNotEmpty()) {
                applyRouteToState(bus.route)
                return@onSuccess
            }
            val routeId = bus.routeId
            if (!routeId.isNullOrBlank()) {
                val routeResult = busRepository.getRouteById(routeId)
                routeResult.onSuccess { r ->
                    applyRouteToState(r)
                }.onFailure {
                    applyRouteToState(BusRepository.getDefaultMdr87Route())
                }
            } else {
                applyRouteToState(BusRepository.getDefaultMdr87Route())
            }
        }.onFailure {
            val allRoutes = busRepository.getRoutes().getOrNull()
            val matchedRoute = allRoutes?.firstOrNull { it.stops.isNotEmpty() }
            if (matchedRoute != null) {
                applyRouteToState(matchedRoute)
            } else {
                applyRouteToState(BusRepository.getDefaultMdr87Route())
            }
        }
    }

    private fun applyRouteToState(r: com.kec.busconnect.data.model.RouteDto) {
        val sortedStops = r.stops.sortedBy { it.sequence ?: 0 }
        val currentDir = _uiState.value.selectedDirection
        val orderedStops = if (currentDir == "EVENING") sortedStops.reversed() else sortedStops
        _uiState.value = _uiState.value.copy(
            route = r,
            stops = orderedStops,
            selectedStop = _uiState.value.selectedStop ?: orderedStops.firstOrNull()
        )
        recalculateProximity()
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

