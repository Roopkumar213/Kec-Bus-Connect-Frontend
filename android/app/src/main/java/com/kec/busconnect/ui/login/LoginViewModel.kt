package com.kec.busconnect.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kec.busconnect.data.model.LoginResponse
import com.kec.busconnect.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val response: LoginResponse) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    val emailInput = MutableStateFlow("")
    val passwordInput = MutableStateFlow("")
    val passwordVisible = MutableStateFlow(false)

    fun togglePasswordVisibility() {
        passwordVisible.value = !passwordVisible.value
    }

    fun login() {
        val email = emailInput.value.trim()
        val password = passwordInput.value.trim()

        if (email.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState.Error("Please enter both email and password.")
            return
        }

        _uiState.value = LoginUiState.Loading

        viewModelScope.launch {
            val result = authRepository.login(email, password)
            result.onSuccess { response ->
                _uiState.value = LoginUiState.Success(response)
            }.onFailure { exception ->
                _uiState.value = LoginUiState.Error(exception.message ?: "Authentication failed.")
            }
        }
    }

    val signupSuccessMessage = MutableStateFlow<String?>(null)
    val signupErrorMessage = MutableStateFlow<String?>(null)
    val isSigningUp = MutableStateFlow(false)

    fun signupStudent(
        fullName: String,
        studentId: String,
        email: String,
        mobile: String,
        collegeType: String,
        program: String,
        department: String?,
        academicYear: Int,
        section: String,
        batch: String,
        boardingLat: Double,
        boardingLng: Double,
        pass: String,
        onSuccess: () -> Unit
    ) {
        if (fullName.isBlank() || studentId.isBlank() || email.isBlank() || mobile.isBlank() || pass.length < 6) {
            signupErrorMessage.value = "Please fill in all required fields. Password must be at least 6 characters."
            return
        }

        isSigningUp.value = true
        signupErrorMessage.value = null
        signupSuccessMessage.value = null

        viewModelScope.launch {
            val req = com.kec.busconnect.data.model.SignupRequestDto(
                fullName = fullName.trim(),
                studentId = studentId.trim().uppercase(),
                email = email.trim().lowercase(),
                mobile = mobile.trim(),
                collegeType = collegeType,
                program = program,
                department = department,
                academicYear = academicYear,
                section = section,
                batch = batch,
                boardingLocation = com.kec.busconnect.data.model.SignupBoardingLocationDto(
                    latitude = boardingLat,
                    longitude = boardingLng,
                    accuracy = 10.0
                ),
                assignedBus = "KEC-07",
                assignedRoute = "Attikuppam → KEC (via MDR87)",
                password = pass.trim()
            )

            val result = authRepository.signupStudent(req)
            isSigningUp.value = false
            result.onSuccess { msg ->
                signupSuccessMessage.value = msg
                emailInput.value = email.trim()
                onSuccess()
            }.onFailure { err ->
                signupErrorMessage.value = err.message ?: "Signup failed. Please check your information."
            }
        }
    }

    fun resetState() {
        _uiState.value = LoginUiState.Idle
        signupErrorMessage.value = null
        signupSuccessMessage.value = null
    }
}
