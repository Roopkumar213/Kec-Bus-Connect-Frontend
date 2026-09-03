package com.kec.busconnect.ui.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.LocationShareStatusDto
import com.kec.busconnect.data.model.StudentDto
import com.kec.busconnect.data.repository.BusRepository
import com.kec.busconnect.data.repository.StudentRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class StudentDashboardUiState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val student: StudentDto? = null,
    val busStatus: LiveBusStatusDto? = null,
    val shareStatus: LocationShareStatusDto? = null,
    val errorMessage: String? = null,
    val passengerConfirmed: Boolean = false
)

class StudentViewModel(
    private val studentRepository: StudentRepository,
    private val busRepository: BusRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudentDashboardUiState(isLoading = true))
    val uiState: StateFlow<StudentDashboardUiState> = _uiState.asStateFlow()

    private var pollingJob: Job? = null

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            loadDashboardData()
            startPolling()
        }
    }

    fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(6000L) // Refresh every 6 seconds
                val currentStudent = _uiState.value.student
                if (currentStudent != null) {
                    val busId = currentStudent.assignedBus ?: "KEC-07"
                    val liveResult = busRepository.getLiveBusStatus(busId)
                    val shareResult = studentRepository.getLocationShareStatus(busId)

                    _uiState.value = _uiState.value.copy(
                        busStatus = liveResult.getOrNull(),
                        shareStatus = shareResult.getOrNull()
                    )
                }
            }
        }
    }

    suspend fun loadDashboardData() {
        val profileResult = studentRepository.getMyProfile()

        profileResult.onSuccess { student ->
            val busId = student.assignedBus ?: "KEC-07"
            val liveResult = busRepository.getLiveBusStatus(busId)
            val shareResult = studentRepository.getLocationShareStatus(busId)

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isRefreshing = false,
                student = student,
                busStatus = liveResult.getOrNull(),
                shareStatus = shareResult.getOrNull(),
                errorMessage = null
            )
        }.onFailure { err ->
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isRefreshing = false,
                errorMessage = "Unable to load student profile: ${err.message ?: "Connection error"}"
            )
        }
    }

    fun refreshManually() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true, errorMessage = null)
            loadDashboardData()
        }
    }

    fun confirmOnBus(tripId: String) {
        viewModelScope.launch {
            studentRepository.confirmOnBus(tripId)
            _uiState.value = _uiState.value.copy(passengerConfirmed = true)
        }
    }

    fun notOnBus(tripId: String) {
        viewModelScope.launch {
            studentRepository.notOnBus(tripId)
            _uiState.value = _uiState.value.copy(passengerConfirmed = false)
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
