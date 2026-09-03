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

    fun resetState() {
        _uiState.value = LoginUiState.Idle
    }
}
