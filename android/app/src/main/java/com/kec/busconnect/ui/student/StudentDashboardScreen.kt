package com.kec.busconnect.ui.student

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.location.BusLocationForegroundService
import com.kec.busconnect.location.LocationHelper
import com.kec.busconnect.ui.components.*
import com.kec.busconnect.ui.theme.*
import java.util.Calendar

@Composable
fun StudentDashboardScreen(
    viewModel: StudentViewModel,
    onTrackBusClick: (String) -> Unit,
    onProfileClick: () -> Unit,
    onLogoutClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    var isSharingLocation by remember { mutableStateOf(false) }
    var showShareConfirmDialog by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            showShareConfirmDialog = true
        }
    }

    val greeting = remember {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        when (hour) {
            in 4..11 -> "Good morning"
            in 12..16 -> "Good afternoon"
            else -> "Good evening"
        }
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Student Dashboard",
                subtitle = "KEC Campus Transit",
                onLogoutClick = onLogoutClick,
                actions = {
                    IconButton(onClick = onProfileClick) {
                        Icon(
                            imageVector = Icons.Default.AccountCircle,
                            contentDescription = "Profile",
                            tint = PrimaryBlue
                        )
                    }
                }
            )
        },
        containerColor = LightBackground
    ) { paddingValues ->
        Crossfade(targetState = uiState.isLoading, label = "StudentLoading") { loading ->
            if (loading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = PrimaryBlue)
                }
            } else {
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
                        Button(
                            onClick = { viewModel.refreshManually() },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("RETRY CONNECTION", fontWeight = FontWeight.Bold)
                        }
                    }

                    // 1. Personalized Header Greeting
                    val studentName = uiState.student?.fullName ?: "Student"
                    Column(modifier = Modifier.padding(start = 4.dp, bottom = 18.dp)) {
                        Text(
                            text = "$greeting,",
                            fontSize = 14.sp,
                            color = TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = studentName,
                            style = MaterialTheme.typography.headlineLarge,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        if (uiState.student?.studentId != null) {
                            Text(
                                text = "Roll: ${uiState.student!!.studentId} • ${uiState.student!!.department ?: "Engineering"}",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                    }

                    // 2. Primary Assigned Bus & Live Telemetry Card
                    val live = uiState.busStatus
                    val displayBusNumber = live?.busNumber ?: if (uiState.student?.assignedBus?.startsWith("KEC") == true) uiState.student!!.assignedBus!! else "KEC-07"

                    GlassCard(
                        borderColor = if (live?.freshness == "LIVE") PrimaryBlueBorder else LightCardBorder
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(PrimaryBlueLight),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.DirectionsBus,
                                        contentDescription = null,
                                        tint = PrimaryBlue,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = displayBusNumber,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "${(live?.speed ?: 0.0).toInt()} km/h",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = PrimaryBlue
                                    )
                                }
                            }

                            FreshnessBadge(freshness = live?.freshness ?: "LIVE")
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        HorizontalDivider(color = LightCardBorder, thickness = 1.dp)
                        Spacer(modifier = Modifier.height(14.dp))

                        // Location Stop & ETA Details
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "CURRENTLY AT",
                                    fontSize = 10.sp,
                                    color = TextMuted,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = live?.currentlyAtStop ?: "Attikuppam (Origin)",
                                    fontSize = 14.sp,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "NEXT STOP",
                                    fontSize = 10.sp,
                                    color = TextMuted,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = live?.nextStop ?: "Manendram Village Stop",
                                    fontSize = 14.sp,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        if (live?.etaMinutesToNextStop != null && live.etaMinutesToNextStop > 0) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(LightSurfaceVariant)
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "ETA to next stop", fontSize = 12.sp, color = TextSecondary)
                                Text(
                                    text = "${live.etaMinutesToNextStop.toInt()} mins",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SuccessEmerald
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Primary Action: TRACK BUS
                        Button(
                            onClick = { onTrackBusClick(displayBusNumber) },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "TRACK BUS LIVE",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Secondary Action: SHARE BUS LOCATION
                        OutlinedButton(
                            onClick = {
                                if (!isSharingLocation) {
                                    if (LocationHelper.hasLocationPermissions(context)) {
                                        showShareConfirmDialog = true
                                    } else {
                                        permissionLauncher.launch(
                                            arrayOf(
                                                Manifest.permission.ACCESS_FINE_LOCATION,
                                                Manifest.permission.ACCESS_COARSE_LOCATION
                                            )
                                        )
                                    }
                                } else {
                                    BusLocationForegroundService.stop(context)
                                    isSharingLocation = false
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = if (isSharingLocation) DangerRose else PrimaryBlue
                            ),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSharingLocation) DangerRose.copy(alpha = 0.5f) else PrimaryBlueBorder
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Icon(
                                imageVector = if (isSharingLocation) Icons.Default.Stop else Icons.Default.ShareLocation,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isSharingLocation) "STOP SHARING LOCATION" else "SHARE BUS LOCATION",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // 3. My Boarding Location Card
                    GlassCard {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "MY BOARDING LOCATION",
                                    fontSize = 10.sp,
                                    color = TextMuted,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = uiState.student?.assignedRoute ?: "Attikuppam (Origin)",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            TextButton(onClick = onProfileClick) {
                                Text(
                                    text = "CHANGE",
                                    color = PrimaryBlue,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }

                    // 4. Driver Passenger Check / Confirmation
                    if (live?.passengerRequestActive == true && !uiState.passengerConfirmed) {
                        Spacer(modifier = Modifier.height(16.dp))
                        GlassCard(borderColor = AccentAmber.copy(alpha = 0.5f), backgroundColor = AccentAmberLight) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = AccentAmber)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Driver Boarding Check",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = AccentAmber,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = "Driver has initiated a boarding check. Please confirm if you are on the bus.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = { viewModel.confirmOnBus(live.activeTripId ?: "active") },
                                    colors = ButtonDefaults.buttonColors(containerColor = SuccessEmerald),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("I'M ON BUS", fontWeight = FontWeight.Bold)
                                }
                                OutlinedButton(
                                    onClick = { viewModel.notOnBus(live.activeTripId ?: "active") },
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("NOT ON BUS", color = DangerRose, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Quick Refresh Button
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        TextButton(onClick = { viewModel.refreshManually() }) {
                            Icon(Icons.Default.Refresh, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Refresh Telemetry", color = TextSecondary, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }

    if (showShareConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showShareConfirmDialog = false },
            title = { Text("Share Live GPS Location", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "KEC BusConnect will broadcast live GPS coordinates from your device in the background so other students can track the bus.",
                    color = TextSecondary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showShareConfirmDialog = false
                        val busId = uiState.student?.assignedBus ?: "KEC-07"
                        BusLocationForegroundService.start(context, busId, busId)
                        isSharingLocation = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                ) {
                    Text("Start Sharing")
                }
            },
            dismissButton = {
                TextButton(onClick = { showShareConfirmDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = LightSurface
        )
    }
}
