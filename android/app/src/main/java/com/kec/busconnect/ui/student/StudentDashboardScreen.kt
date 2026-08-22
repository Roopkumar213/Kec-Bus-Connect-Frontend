package com.kec.busconnect.ui.student

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.ui.components.*
import com.kec.busconnect.ui.theme.*

@Composable
fun StudentDashboardScreen(
    viewModel: StudentViewModel,
    onTrackBusClick: (String) -> Unit,
    onProfileClick: () -> Unit,
    onLogoutClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            AppHeader(
                title = "Student Dashboard",
                subtitle = "KEC BusConnect",
                onLogoutClick = onLogoutClick,
                actions = {
                    IconButton(onClick = onProfileClick) {
                        Icon(
                            imageVector = Icons.Default.AccountCircle,
                            contentDescription = "Profile",
                            tint = TextPrimary
                        )
                    }
                }
            )
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        if (uiState.isLoading) {
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
                }

                // 1. Student Greeting & Assignment Card
                GlassCard {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(
                                text = "Welcome,",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                            Text(
                                text = uiState.student?.fullName ?: "Student",
                                style = MaterialTheme.typography.headlineMedium,
                                color = TextPrimary
                            )
                            Text(
                                text = "ID: ${uiState.student?.studentId ?: "22KEC401"} • ${uiState.student?.department ?: "CSE"}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(PrimaryBlue.copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.DirectionsBus,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    Divider(
                        color = DarkCardBorder,
                        thickness = 1.dp,
                        modifier = Modifier.padding(vertical = 12.dp)
                    )

                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(text = "ASSIGNED BUS", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                            Text(
                                text = uiState.student?.assignedBus ?: "KEC-07",
                                fontSize = 15.sp,
                                color = TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Column {
                            Text(text = "BOARDING STOP", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                            Text(
                                text = uiState.student?.assignedRoute ?: "Attikuppam (Origin)",
                                fontSize = 15.sp,
                                color = TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 2. Live Bus Status Telemetry Preview Card
                val assignedBusNumber = uiState.student?.assignedBus ?: "KEC-07"
                val live = uiState.busStatus

                GlassCard {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(
                                text = "Live Telemetry: $assignedBusNumber",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextPrimary
                            )
                            Text(
                                text = live?.currentlyAtStop?.let { "At stop: $it" }
                                    ?: live?.nextStop?.let { "Next: $it (~${live.distanceToNextStopKm ?: 0.0} km)" }
                                    ?: "In Transit",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                        }

                        FreshnessBadge(freshness = live?.freshness ?: "LIVE")
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        TripDirectionBadge(direction = live?.direction ?: "MORNING")
                        SourceTypeBadge(sourceType = live?.sourceType)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Primary Track Bus CTA Button
                    Button(
                        onClick = { onTrackBusClick(assignedBusNumber) },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PrimaryBlue,
                            contentColor = TextPrimary
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "TRACK LIVE BUS & MAP",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 3. Driver Passenger Check / Confirmation (If Active)
                if (live?.passengerRequestActive == true && !uiState.passengerConfirmed) {
                    GlassCard(borderColor = AccentAmber) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.NotificationsActive, contentDescription = null, tint = AccentAmber)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Driver Boarding Check",
                                style = MaterialTheme.typography.titleMedium,
                                color = AccentAmber
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
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("I'M ON BUS", fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { viewModel.notOnBus(live.activeTripId ?: "active") },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("NOT ON BUS", color = DangerRose)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // 4. Quick Actions
                Text(
                    text = "QUICK ACTIONS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = onProfileClick,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp)
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = TextPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("My Stops", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = { viewModel.refreshManually() },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, tint = TextPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Refresh", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
