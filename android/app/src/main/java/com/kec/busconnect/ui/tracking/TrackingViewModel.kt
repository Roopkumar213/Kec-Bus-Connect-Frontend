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

data class TrackingUiState(
    val isLoading: Boolean = true,
    val busNumber: String = "KEC-07",
    val liveStatus: LiveBusStatusDto? = null,
    val route: RouteDto? = null,
    val stops: List<StopDto> = emptyList(),
    val shareStatus: LocationShareStatusDto? = null,
    val isSharingLocationLocally: Boolean = false,
    val shareError: String? = null,
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
        _uiState.value = _uiState.value.copy(busNumber = busNumber, isLoading = true)
        
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

    private suspend fun fetchTelemetry(busNumber: String) {
        val result = busRepository.getLiveBusStatus(busNumber)
        result.onSuccess { live ->
            // If route not loaded yet, load it
            if (_uiState.value.route == null) {
                loadRouteDetails(busNumber)
            }

            val rawStops = _uiState.value.route?.stops ?: emptyList()
            val sortedStops = rawStops.sortedBy { it.sequence ?: 0 }
            val stopsList = if (live.direction == "EVENING") {
                sortedStops.reversed()
            } else {
                sortedStops
            }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                liveStatus = live,
                stops = stopsList
            )
        }.onFailure { err ->
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = err.message
            )
        }
    }

    private suspend fun loadRouteDetails(busId: String) {
        val busResult = busRepository.getBusDetails(busId)
        busResult.onSuccess { bus ->
            val routeId = bus.routeId
            if (routeId != null) {
                val routeResult = busRepository.getRouteById(routeId)
                routeResult.onSuccess { r ->
                    val sortedStops = r.stops.sortedBy { it.sequence ?: 0 }
                    _uiState.value = _uiState.value.copy(
                        route = r,
                        stops = if (_uiState.value.liveStatus?.direction == "EVENING") sortedStops.reversed() else sortedStops
                    )
                }
            } else {
                // Fallback to first route if none assigned (legacy/demo behavior)
                val routesResult = busRepository.getRoutes()
                routesResult.onSuccess { routes ->
                    val r = routes.firstOrNull()
                    if (r != null) {
                        val sortedStops = r.stops.sortedBy { it.sequence ?: 0 }
                        _uiState.value = _uiState.value.copy(
                            route = r,
                            stops = if (_uiState.value.liveStatus?.direction == "EVENING") sortedStops.reversed() else sortedStops
                        )
                    }
                }
            }
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
