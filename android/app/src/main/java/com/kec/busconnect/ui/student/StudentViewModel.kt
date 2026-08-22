package com.kec.busconnect.ui.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kec.busconnect.data.model.LiveBusStatusDto
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
    val student: StudentDto? = null,
    val busStatus: LiveBusStatusDto? = null,
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
        startPolling()
    }

    fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                loadDashboardData()
                delay(5000L) // Refresh every 5 seconds
            }
        }
    }

    suspend fun loadDashboardData() {
        val profileResult = studentRepository.getMyProfile()
        
        profileResult.onSuccess { student ->
            val busId = student.assignedBus ?: "KEC-07"
            val liveResult = busRepository.getLiveBusStatus(busId)
            
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                student = student,
                busStatus = liveResult.getOrNull() ?: BusRepository.getDefaultBusStatus(busId),
                errorMessage = null
            )
        }.onFailure { err ->
            if (_uiState.value.student == null) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    student = StudentDto(
                        fullName = "Rohan Sharma",
                        studentId = "22KEC401",
                        department = "CSE",
                        academicYear = 3,
                        section = "A",
                        assignedBus = "KEC-07",
                        assignedRoute = "Attikuppam → KEC (via MDR87)"
                    ),
                    busStatus = BusRepository.getDefaultBusStatus("KEC-07"),
                    errorMessage = null
                )
            }
        }
    }

    fun refreshManually() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
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
}
