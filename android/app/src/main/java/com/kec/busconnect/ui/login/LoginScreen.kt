package com.kec.busconnect.ui.login

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.data.api.ApiClient
import com.kec.busconnect.data.model.LoginResponse
import com.kec.busconnect.data.repository.BusRepository
import com.kec.busconnect.ui.components.ErrorBanner
import com.kec.busconnect.ui.components.GlassCard
import com.kec.busconnect.ui.theme.*

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: (LoginResponse) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val email by viewModel.emailInput.collectAsState()
    val password by viewModel.passwordInput.collectAsState()
    val passwordVisible by viewModel.passwordVisible.collectAsState()
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()

    var showServerConfigDialog by remember { mutableStateOf(false) }
    var showSignupDialog by remember { mutableStateOf(false) }
    var customServerUrlInput by remember { mutableStateOf(ApiClient.getBaseUrl()) }

    LaunchedEffect(uiState) {
        if (uiState is LoginUiState.Success) {
            onLoginSuccess((uiState as LoginUiState.Success).response)
            viewModel.resetState()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBackground)
            .padding(horizontal = 24.dp, vertical = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState)
        ) {
            // Server Environment Config icon at top right
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                IconButton(onClick = {
                    customServerUrlInput = ApiClient.getBaseUrl()
                    showServerConfigDialog = true
                }) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Server Settings",
                        tint = TextMuted
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Branding Icon & Title
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .clip(CircleShape)
                    .background(PrimaryBlueLight),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.DirectionsBus,
                    contentDescription = "KEC BusConnect",
                    tint = PrimaryBlue,
                    modifier = Modifier.size(42.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "KEC BusConnect",
                style = MaterialTheme.typography.headlineLarge,
                color = TextPrimary,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "Kuppam Engineering College Transit Portal",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Login Card
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Sign In to Your Account",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                if (uiState is LoginUiState.Error) {
                    ErrorBanner(
                        message = (uiState as LoginUiState.Error).message,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                // Email Input Field
                OutlinedTextField(
                    value = email,
                    onValueChange = { viewModel.emailInput.value = it },
                    label = { Text("College Email") },
                    placeholder = { Text("student@kec.ac.in", color = TextMuted) },
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = null, tint = PrimaryBlue)
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    ),
                    keyboardActions = KeyboardActions(
                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryBlue,
                        unfocusedBorderColor = LightCardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = PrimaryBlue
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Password Input Field with Toggle Visibility
                OutlinedTextField(
                    value = password,
                    onValueChange = { viewModel.passwordInput.value = it },
                    label = { Text("Password") },
                    placeholder = { Text("••••••••", color = TextMuted) },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryBlue)
                    },
                    trailingIcon = {
                        IconButton(onClick = { viewModel.togglePasswordVisibility() }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                tint = TextSecondary
                            )
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            viewModel.login()
                        }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryBlue,
                        unfocusedBorderColor = LightCardBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = PrimaryBlue
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Primary Login Button
                Button(
                    onClick = {
                        focusManager.clearFocus()
                        viewModel.login()
                    },
                    enabled = uiState !is LoginUiState.Loading,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = PrimaryBlue,
                        contentColor = Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (uiState is LoginUiState.Loading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(22.dp),
                            strokeWidth = 2.5.dp
                        )
                    } else {
                        Text(
                            text = "LOGIN",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))

                // Student Signup Button
                OutlinedButton(
                    onClick = { showSignupDialog = true },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryBlue),
                    border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryBlueBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = "NEW STUDENT? CREATE ACCOUNT",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Quick Role Switch Helper
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                TextButton(onClick = {
                    viewModel.emailInput.value = "student@kec.ac.in"
                    viewModel.passwordInput.value = "student123"
                }) {
                    Text("Student Demo", fontSize = 12.sp, color = TextSecondary)
                }
                Text("•", modifier = Modifier.padding(top = 14.dp), color = TextMuted)
                TextButton(onClick = {
                    viewModel.emailInput.value = "driver@kec.ac.in"
                    viewModel.passwordInput.value = "driver123"
                }) {
                    Text("Driver Demo", fontSize = 12.sp, color = TextSecondary)
                }
            }

            // Active Server Endpoint Indicator
            Text(
                text = "Server: ${ApiClient.getBaseUrl()}",
                fontSize = 11.sp,
                color = TextMuted,
                textAlign = TextAlign.Center
            )
        }
    }

    val signupSuccess by viewModel.signupSuccessMessage.collectAsState()
    val signupError by viewModel.signupErrorMessage.collectAsState()
    val isSigningUp by viewModel.isSigningUp.collectAsState()
    val corridorStops = remember { BusRepository.getDefaultMdr87Route().stops }

    if (showSignupDialog) {
        var newFullName by remember { mutableStateOf("") }
        var newStudentId by remember { mutableStateOf("") }
        var newEmail by remember { mutableStateOf("") }
        var newMobile by remember { mutableStateOf("") }
        var newCollegeType by remember { mutableStateOf("ENGINEERING") }
        var newProgram by remember { mutableStateOf("BTECH") }
        var newDept by remember { mutableStateOf("CSE") }
        var newYear by remember { mutableStateOf(1) }
        var newSection by remember { mutableStateOf("A") }
        var newBatch by remember { mutableStateOf("2023 - 2027") }
        var selectedStopName by remember { mutableStateOf("Attikuppam (Origin)") }
        var selectedStopLat by remember { mutableStateOf(12.884713) }
        var selectedStopLng by remember { mutableStateOf(78.479812) }
        var showStopDropdown by remember { mutableStateOf(false) }
        var newPassword by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showSignupDialog = false },
            title = { Text("Student Registration", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 420.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    if (signupError != null) {
                        Text("⚠ $signupError", color = DangerRose, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp))
                    }
                    if (signupSuccess != null) {
                        Text("✓ $signupSuccess", color = SuccessEmerald, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp))
                    }

                    OutlinedTextField(value = newFullName, onValueChange = { newFullName = it }, label = { Text("Full Name") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = newStudentId, onValueChange = { newStudentId = it }, label = { Text("Student Roll ID (e.g. 23KEC501)") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = newEmail, onValueChange = { newEmail = it }, label = { Text("Email (@kec.ac.in)") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = newMobile, onValueChange = { newMobile = it }, label = { Text("Mobile Number (10 digits)") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Program selection
                    Text("College & Program:", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                    Row(modifier = Modifier.padding(vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(selected = newProgram == "BTECH", onClick = { newCollegeType = "ENGINEERING"; newProgram = "BTECH"; newDept = "CSE" }, label = { Text("B.Tech") })
                        FilterChip(selected = newProgram == "BCA", onClick = { newCollegeType = "DEGREE"; newProgram = "BCA"; newDept = "BCA" }, label = { Text("BCA") })
                        FilterChip(selected = newProgram == "DIPLOMA", onClick = { newCollegeType = "DIPLOMA"; newProgram = "DIPLOMA"; newDept = "ECE" }, label = { Text("Diploma") })
                        FilterChip(selected = newProgram == "MBA", onClick = { newCollegeType = "MBA"; newProgram = "MBA"; newDept = "MBA" }, label = { Text("MBA") })
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = newDept, onValueChange = { newDept = it }, label = { Text("Department (e.g. CSE, ECE, AI_ML)") }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))

                    // Boarding Stop Selection
                    Text("Boarding Stop (MDR87 Corridor):", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                    OutlinedCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showStopDropdown = true }
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = selectedStopName, color = PrimaryBlue, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = PrimaryBlue)
                        }
                    }

                    if (showStopDropdown) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 200.dp)
                                .verticalScroll(rememberScrollState())
                                .border(1.dp, LightCardBorder, RoundedCornerShape(8.dp))
                                .padding(4.dp)
                        ) {
                            corridorStops.forEach { stop ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            selectedStopName = stop.name
                                            selectedStopLat = stop.latitude ?: 12.884713
                                            selectedStopLng = stop.longitude ?: 78.479812
                                            showStopDropdown = false
                                        }
                                        .padding(8.dp)
                                ) {
                                    Text(text = stop.name, fontSize = 12.sp, color = TextPrimary)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = newPassword, onValueChange = { newPassword = it }, label = { Text("Password (min 6 chars)") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.signupStudent(
                            fullName = newFullName,
                            studentId = newStudentId,
                            email = newEmail,
                            mobile = newMobile,
                            collegeType = newCollegeType,
                            program = newProgram,
                            department = newDept,
                            academicYear = newYear,
                            section = newSection,
                            batch = newBatch,
                            boardingLat = selectedStopLat,
                            boardingLng = selectedStopLng,
                            pass = newPassword,
                            onSuccess = { showSignupDialog = false }
                        )
                    },
                    enabled = !isSigningUp,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                ) {
                    if (isSigningUp) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp))
                    } else {
                        Text("Register")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showSignupDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = LightSurface
        )
    }

    // Server Environment Settings Dialog
    if (showServerConfigDialog) {
        AlertDialog(
            onDismissRequest = { showServerConfigDialog = false },
            title = { Text("Server Environment", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        "Set backend server base URL for API requests:",
                        fontSize = 13.sp,
                        color = TextSecondary,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    OutlinedTextField(
                        value = customServerUrlInput,
                        onValueChange = { customServerUrlInput = it },
                        label = { Text("Server URL") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryBlue,
                            unfocusedBorderColor = LightCardBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    TextButton(onClick = {
                        customServerUrlInput = "http://10.0.2.2:8080"
                    }) {
                        Text("Use Emulator (10.0.2.2:8080)", fontSize = 12.sp, color = PrimaryBlue)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        ApiClient.setCustomBaseUrl(customServerUrlInput)
                        showServerConfigDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showServerConfigDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = LightSurface
        )
    }
}
