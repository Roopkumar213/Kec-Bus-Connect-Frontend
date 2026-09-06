package com.kec.busconnect.ui.driver

import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.location.BusLocationForegroundService
import com.kec.busconnect.ui.components.*
import com.kec.busconnect.ui.theme.*

@Composable
fun DriverDashboardScreen(
    viewModel: DriverViewModel,
    onLogoutClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    var selectedDirection by remember { mutableStateOf("MORNING") }

    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val locationGranted = permissions[android.Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[android.Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (locationGranted) {
            viewModel.startTrip(selectedDirection)
        }
    }

    // Start / Stop Foreground Service whenever Driver starts a trip
    // Only react when isSharingLocation becomes TRUE to avoid stopping on initial load
    LaunchedEffect(uiState.isSharingLocation) {
        if (uiState.isSharingLocation) {
            BusLocationForegroundService.start(context, uiState.busNumber, uiState.busNumber)
        }
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Driver Console",
                subtitle = "Bus ${uiState.busNumber} Navigation",
                onLogoutClick = onLogoutClick
            )
        },
        containerColor = LightBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(scrollState)
        ) {
            if (uiState.errorMessage != null) {
                ErrorBanner(
                    message = uiState.errorMessage!!,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }

            // Trip Status Card
            GlassCard(
                borderColor = if (uiState.activeTrip != null) SuccessEmerald.copy(alpha = 0.5f) else LightCardBorder
            ) {
                Row(
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text(text = "ASSIGNED BUS", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text(
                            text = uiState.busNumber,
                            style = MaterialTheme.typography.headlineMedium,
                            color = TextPrimary,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }

                    if (uiState.activeTrip != null) {
                        Box(
                            modifier = Modifier
                                .background(SuccessEmeraldLight, RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(text = "● TRIP ACTIVE", color = SuccessEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .background(LightSurfaceVariant, RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(text = "IDLE / NOT STARTED", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (uiState.activeTrip == null) {
                    // Morning / Evening Selector before starting trip
                    Text(text = "Select Direction:", fontSize = 13.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 8.dp)
                    ) {
                        FilterChip(
                            selected = selectedDirection == "MORNING",
                            onClick = { selectedDirection = "MORNING" },
                            label = { Text("🌅 Morning (To College)") }
                        )
                        FilterChip(
                            selected = selectedDirection == "EVENING",
                            onClick = { selectedDirection = "EVENING" },
                            label = { Text("🌆 Evening (To Home)") }
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            val perms = mutableListOf(
                                android.Manifest.permission.ACCESS_FINE_LOCATION,
                                android.Manifest.permission.ACCESS_COARSE_LOCATION
                            )
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                                perms.add(android.Manifest.permission.POST_NOTIFICATIONS)
                            }
                            permissionLauncher.launch(perms.toTypedArray())
                        },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SuccessEmerald),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("START TRIP & BROADCAST GPS", fontWeight = FontWeight.Bold)
                    }
                } else {
                    TripDirectionBadge(direction = uiState.activeTrip?.direction)
                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            BusLocationForegroundService.stop(context)
                            viewModel.stopTrip()
                        },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DangerRose),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        Icon(Icons.Default.Stop, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("STOP TRIP", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Passenger Verification Section
            if (uiState.activeTrip != null) {
                GlassCard {
                    Text(
                        text = "Passenger Verification",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    val summary = uiState.passengerSummary
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        StatItem("Total", "${summary?.totalAssigned ?: 0}")
                        StatItem("On Bus", "${summary?.confirmedOnBus ?: 0}", SuccessEmerald)
                        StatItem("Not On Bus", "${summary?.notOnBus ?: 0}", DangerRose)
                        StatItem("Pending", "${summary?.pending ?: 0}", AccentAmber)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedButton(
                        onClick = { viewModel.requestPassengerConfirmation() },
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryBlueBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = PrimaryBlue)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("SEND BOARDING CHECK ALERT", color = PrimaryBlue, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatItem(label: String, value: String, color: Color = TextPrimary) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = color)
        Text(text = label, fontSize = 11.sp, color = TextMuted)
    }
}
