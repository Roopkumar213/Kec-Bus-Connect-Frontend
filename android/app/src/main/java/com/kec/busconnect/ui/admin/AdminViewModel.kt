package com.kec.busconnect.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kec.busconnect.data.model.BusDto
import com.kec.busconnect.data.model.StudentDto
import com.kec.busconnect.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AdminUiState(
    val isLoading: Boolean = false,
    val totalStudents: Int = 0,
    val totalBuses: Int = 0,
    val students: List<StudentDto> = emptyList(),
    val buses: List<BusDto> = emptyList(),
    val errorMessage: String? = null
)

class AdminViewModel(private val adminRepository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminUiState(isLoading = true))
    val uiState: StateFlow<AdminUiState> = _uiState.asStateFlow()

    init {
        loadAdminData()
    }

    fun loadAdminData() {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val studentsResult = adminRepository.getAdminStudents()
            val busesResult = adminRepository.getAdminBuses()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                students = studentsResult.getOrDefault(emptyList()),
                totalStudents = studentsResult.getOrDefault(emptyList()).size,
                buses = busesResult.getOrDefault(emptyList()),
                totalBuses = busesResult.getOrDefault(emptyList()).size
            )
        }
    }
}
