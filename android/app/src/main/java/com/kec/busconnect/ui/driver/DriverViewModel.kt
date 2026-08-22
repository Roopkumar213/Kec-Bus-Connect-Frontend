package com.kec.busconnect.ui.driver

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kec.busconnect.data.model.PassengerSummaryDto
import com.kec.busconnect.data.model.TripDto
import com.kec.busconnect.data.repository.DriverRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DriverUiState(
    val isLoading: Boolean = false,
    val busNumber: String = "KEC-07",
    val activeTrip: TripDto? = null,
    val passengerSummary: PassengerSummaryDto? = null,
    val isSharingLocation: Boolean = false,
    val message: String? = null,
    val errorMessage: String? = null
)

class DriverViewModel(private val driverRepository: DriverRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(DriverUiState(isLoading = true))
    val uiState: StateFlow<DriverUiState> = _uiState.asStateFlow()

    fun loadActiveTrip(busId: String = "KEC-07") {
        _uiState.value = _uiState.value.copy(busNumber = busId, isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val result = driverRepository.getActiveTrip(busId)
            result.onSuccess { trip ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    activeTrip = trip,
                    isSharingLocation = trip != null
                )
                if (trip != null) {
                    loadPassengers(trip.id)
                }
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, activeTrip = null)
            }
        }
    }

    fun startTrip(direction: String = "MORNING") {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val result = driverRepository.startTrip(_uiState.value.busNumber, direction)
            result.onSuccess { trip ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    activeTrip = trip,
                    isSharingLocation = true,
                    message = "Trip started ($direction)!"
                )
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = err.message ?: "Failed to start trip"
                )
            }
        }
    }

    fun stopTrip() {
        val tripId = _uiState.value.activeTrip?.id ?: return
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val result = driverRepository.stopTrip(tripId)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    activeTrip = null,
                    isSharingLocation = false,
                    message = "Trip completed and stopped."
                )
            }.onFailure { err ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = err.message ?: "Failed to stop trip"
                )
            }
        }
    }

    fun requestPassengerConfirmation() {
        val tripId = _uiState.value.activeTrip?.id ?: return

        viewModelScope.launch {
            val result = driverRepository.requestPassengerConfirmation(tripId)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(message = "Passenger check alert broadcasted!")
                loadPassengers(tripId)
            }
        }
    }

    fun loadPassengers(tripId: String) {
        viewModelScope.launch {
            val result = driverRepository.getPassengerSummary(tripId)
            result.onSuccess { summary ->
                _uiState.value = _uiState.value.copy(passengerSummary = summary)
            }
        }
    }
}
