package com.kec.busconnect.ui.tracking

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.location.BusLocationForegroundService
import com.kec.busconnect.location.LocationHelper
import com.kec.busconnect.ui.components.*
import com.kec.busconnect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
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

    LaunchedEffect(busNumber) {
        viewModel.startTracking(busNumber)
    }

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
                subtitle = "Bus $busNumber • MDR87",
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(scrollState)
        ) {
            // 1. Arrival Alert Banner
            if (uiState.arrivalAlert != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = AccentAmber.copy(alpha = 0.15f))
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.NotificationsActive,
                            contentDescription = null,
                            tint = AccentAmber,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = uiState.arrivalAlert!!,
                            color = AccentAmber,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // 2. Direction Toggle (Morning Arrival vs Evening Departure)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(DarkSurface),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                val isMorning = uiState.selectedDirection == "MORNING"
                Button(
                    onClick = { viewModel.setDirection("MORNING") },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isMorning) PrimaryBlue else DarkSurface
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f).padding(4.dp)
                ) {
                    Text(
                        text = "🌅 Morning (To KEC)",
                        fontSize = 12.sp,
                        fontWeight = if (isMorning) FontWeight.Bold else FontWeight.Normal,
                        color = if (isMorning) TextPrimary else TextSecondary
                    )
                }

                Button(
                    onClick = { viewModel.setDirection("EVENING") },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (!isMorning) PurpleEvening else DarkSurface
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f).padding(4.dp)
                ) {
                    Text(
                        text = "🌇 Evening (Return)",
                        fontSize = 12.sp,
                        fontWeight = if (!isMorning) FontWeight.Bold else FontWeight.Normal,
                        color = if (!isMorning) TextPrimary else TextSecondary
                    )
                }
            }

            // 3. Interactive Dual-Engine Map View (OpenStreetMap / Google Maps)
            NativeMapView(
                liveStatus = uiState.liveStatus,
                stops = uiState.stops
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 4. Boarding Stop Selector & Live Proximity Card
            var showStopDialog by remember { mutableStateOf(false) }

            GlassCard {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { showStopDialog = true }
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "YOUR BOARDING / DROP STOP",
                            fontSize = 10.sp,
                            color = TextMuted,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = uiState.selectedStop?.name ?: "Attikuppam (Origin)",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        if (uiState.selectedStop?.landmark != null) {
                            Text(
                                text = uiState.selectedStop!!.landmark!!,
                                fontSize = 12.sp,
                                color = TextSecondary
                            )
                        }
                    }
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(PrimaryBlue.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = "Change Stop",
                            tint = PrimaryBlue,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDivider(color = DarkCardBorder, thickness = 1.dp)
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text(text = "DISTANCE TO STOP", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text(
                            text = uiState.distanceToSelectedStopKm?.let { "${String.format(java.util.Locale.US, "%.1f", it)} km" } ?: "-- km",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryBlue
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(text = "ESTIMATED ARRIVAL", fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                        Text(
                            text = uiState.etaMinutesToSelectedStop?.let { "~${it.toInt()} mins" } ?: "-- mins",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = SuccessEmerald
                        )
                    }
                }
            }

            if (showStopDialog) {
                AlertDialog(
                    onDismissRequest = { showStopDialog = false },
                    title = { Text("Select Stop", color = TextPrimary, fontWeight = FontWeight.Bold) },
                    text = {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 360.dp)
                                .verticalScroll(rememberScrollState())
                        ) {
                            uiState.stops.forEachIndexed { idx, stop ->
                                val isSelected = stop.name == uiState.selectedStop?.name
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isSelected) PrimaryBlue.copy(alpha = 0.15f) else DarkSurface)
                                        .clickable {
                                            viewModel.selectStop(stop.name)
                                            showStopDialog = false
                                        }
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .background(if (isSelected) PrimaryBlue else DarkSurfaceVariant, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(text = "${idx + 1}", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(text = stop.name, color = if (isSelected) PrimaryBlue else TextPrimary, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                        if (stop.landmark != null) {
                                            Text(text = stop.landmark!!, color = TextMuted, fontSize = 11.sp)
                                        }
                                    }
                                    if (isSelected) {
                                        Icon(Icons.Default.Check, contentDescription = null, tint = PrimaryBlue, modifier = Modifier.size(18.dp))
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { showStopDialog = false }) {
                            Text("Close", color = PrimaryBlue)
                        }
                    },
                    containerColor = DarkSurface
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 5. Passenger Confirmation Card ("Are you on this bus?")
            GlassCard(
                borderColor = if (uiState.isBoarded) SuccessEmerald else DarkCardBorder
            ) {
                Row(
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (uiState.isBoarded) Icons.Default.CheckCircle else Icons.Default.DirectionsWalk,
                                contentDescription = null,
                                tint = if (uiState.isBoarded) SuccessEmerald else PrimaryBlue,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (uiState.isBoarded) "Boarding Confirmed" else "Are you on this bus?",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextPrimary
                            )
                        }
                        Text(
                            text = if (uiState.isBoarded) "You are marked as safely boarded on Bus $busNumber." else "Tap below to confirm your presence for attendance.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }

                    if (!uiState.isBoarded) {
                        Button(
                            onClick = { viewModel.confirmBoarding() },
                            colors = ButtonDefaults.buttonColors(containerColor = SuccessEmerald),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("I'm On Bus", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 6. Student Location Sharing Panel
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
                                "Your phone's GPS is sharing this bus's live location with fellow passengers."
                            } else {
                                "Travelling on this bus? Help other students by sharing live GPS."
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

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
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        modifier = Modifier.fillMaxWidth().height(46.dp)
                    ) {
                        Icon(Icons.Default.ShareLocation, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "SHARE BUS LOCATION", fontWeight = FontWeight.Bold)
                    }
                } else {
                    Button(
                        onClick = {
                            BusLocationForegroundService.stop(context)
                            viewModel.setLocalSharingState(false)
                        },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DangerRose),
                        modifier = Modifier.fillMaxWidth().height(46.dp)
                    ) {
                        Icon(Icons.Default.Stop, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("STOP SHARING LOCATION", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 7. Route Stops Timeline
            Text(
                text = "CORRIDOR STOPS & LANDMARKS (${uiState.stops.size} STOPS)",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextMuted,
                modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
            )

            uiState.stops.forEachIndexed { index, stop ->
                val isCurrent = stop.name == uiState.liveStatus?.currentlyAtStop
                val isSelected = stop.name == uiState.selectedStop?.name

                GlassCard(
                    borderColor = if (isSelected) PrimaryBlue else if (isCurrent) SuccessEmerald else DarkCardBorder,
                    modifier = Modifier
                        .padding(bottom = 8.dp)
                        .clickable { viewModel.selectStop(stop.name) }
                ) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(26.dp)
                                    .background(
                                        if (isSelected) PrimaryBlue else if (isCurrent) SuccessEmerald else PrimaryBlue.copy(alpha = 0.2f),
                                        RoundedCornerShape(6.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${index + 1}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected || isCurrent) TextPrimary else PrimaryBlue
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = stop.name,
                                    fontSize = 14.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = TextPrimary
                                )
                                if (stop.landmark != null) {
                                    Text(
                                        text = stop.landmark!!,
                                        fontSize = 11.sp,
                                        color = TextMuted
                                    )
                                }
                            }
                        }

                        if (isCurrent) {
                            Text(text = "CURRENT", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = SuccessEmerald)
                        } else if (isSelected) {
                            Text(text = "SELECTED", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        }
                    }
                }
            }
        }
    }

    if (showShareConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showShareConfirmDialog = false },
            title = { Text("Share Live Bus Location", color = TextPrimary) },
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

