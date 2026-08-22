package com.kec.busconnect.ui.tracking

import android.Manifest
import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.location.BusLocationForegroundService
import com.kec.busconnect.location.LocationHelper
import com.kec.busconnect.ui.components.*
import com.kec.busconnect.ui.theme.*

@Composable
fun BusTrackingScreen(
    busNumber: String,
    viewModel: TrackingViewModel,
    onBackClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    var showShareConfirmDialog by remember { mutableStateOf(false) }

    // Start tracking on load
    LaunchedEffect(busNumber) {
        viewModel.startTracking(busNumber)
    }

    // Permission launcher for Location + Notifications
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val locationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true

        if (locationGranted) {
            showShareConfirmDialog = true
        } else {
            viewModel.setLocalSharingState(false, "Location permission is required to share bus location.")
        }
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = "Live Bus Tracking",
                subtitle = "Bus $busNumber",
                onBackClick = onBackClick,
                actions = {
                    FreshnessBadge(
                        freshness = uiState.liveStatus?.freshness ?: "LIVE",
                        modifier = Modifier.padding(end = 12.dp)
                    )
                }
            )
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        if (uiState.isLoading && uiState.liveStatus == null) {
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
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                }

                // 1. Direction Banner
                Row(
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                ) {
                    TripDirectionBadge(direction = uiState.liveStatus?.direction)
                    SourceTypeBadge(sourceType = uiState.liveStatus?.sourceType)
                }

                // 2. Map View
                NativeMapView(
                    liveStatus = uiState.liveStatus,
                    stops = uiState.stops
                )

                Spacer(modifier = Modifier.height(16.dp))

                // 3. Telemetry & Proximity Card
                val live = uiState.liveStatus
                GlassCard {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(text = "CURRENT POSITION", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                            Text(
                                text = live?.currentlyAtStop?.let { "At stop: $it" } ?: "In Transit",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "SPEED", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                            Text(
                                text = "${(live?.speed ?: 0.0).toInt()} km/h",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryBlue
                            )
                        }
                    }

                    Divider(color = DarkCardBorder, thickness = 1.dp, modifier = Modifier.padding(vertical = 10.dp))

                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(text = "NEXT STOP", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                            Text(
                                text = live?.nextStop ?: "KEC Campus",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "APPROX ETA", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                            Text(
                                text = live?.etaMinutesToNextStop?.let { "~${it.toInt()} mins" } ?: "Calculated live",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = SuccessEmerald
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 4. STUDENT LOCATION SHARING PANEL (Core Feature)
                val share = uiState.shareStatus
                val isSharing = uiState.isSharingLocationLocally

                GlassCard(
                    borderColor = if (isSharing) SuccessEmerald else DarkCardBorder
                ) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Navigation,
                                    contentDescription = null,
                                    tint = if (isSharing) SuccessEmerald else PrimaryBlue,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (isSharing) "Location Sharing Active" else "Share Bus Location",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = TextPrimary
                                )
                            }
                            Text(
                                text = if (isSharing) {
                                    "Your phone's GPS is sharing this bus's live location with fellow passengers in background."
                                } else {
                                    "Travelling on this bus? Help other students by sharing live GPS."
                                },
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }

                    if (uiState.shareError != null) {
                        Text(
                            text = "⚠ ${uiState.shareError}",
                            color = DangerRose,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    if (!isSharing) {
                        Button(
                            onClick = {
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
                            },
                            enabled = share?.currentSource != "DRIVER",
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Icon(Icons.Default.ShareLocation, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (share?.currentSource == "DRIVER") "DRIVER IS SHARING GPS" else "SHARE BUS LOCATION",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    } else {
                        Button(
                            onClick = {
                                BusLocationForegroundService.stop(context)
                                viewModel.setLocalSharingState(false)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = DangerRose),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("STOP SHARING LOCATION", fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 5. Route Stops List
                if (uiState.stops.isNotEmpty()) {
                    Text(
                        text = "ROUTE STOPS TIMELINE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMuted,
                        modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
                    )

                    uiState.stops.forEachIndexed { index, stop ->
                        GlassCard(modifier = Modifier.padding(bottom = 8.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .background(PrimaryBlue.copy(alpha = 0.2f), RoundedCornerShape(6.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(text = "${index + 1}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(
                                        text = stop.name,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = TextPrimary
                                    )
                                }

                                if (stop.name == uiState.liveStatus?.currentlyAtStop) {
                                    Text(text = "CURRENT", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = SuccessEmerald)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Confirmation Dialog before starting location sharing
        if (showShareConfirmDialog) {
            AlertDialog(
                onDismissRequest = { showShareConfirmDialog = false },
                title = { Text("Share Live Bus Location", color = TextPrimary) },
                text = {
                    Text(
                        "KEC BusConnect needs your location to share the bus's live coordinates with other passengers while you are on board.\n\nA background notification will stay active while location sharing is running.",
                        color = TextSecondary
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showShareConfirmDialog = false
                            BusLocationForegroundService.start(context, busNumber, busNumber)
                            viewModel.setLocalSharingState(true)
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
                containerColor = DarkSurface
            )
        }
    }
}
