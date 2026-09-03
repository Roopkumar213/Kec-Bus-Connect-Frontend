package com.kec.busconnect.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.ui.components.AppHeader
import com.kec.busconnect.ui.components.ErrorBanner
import com.kec.busconnect.ui.components.GlassCard
import com.kec.busconnect.ui.theme.*

@Composable
fun AdminDashboardScreen(
    viewModel: AdminViewModel,
    onLogoutClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) } // 0 = Fleet Buses, 1 = Students

    Scaffold(
        topBar = {
            AppHeader(
                title = "Admin Console",
                subtitle = "Campus Fleet & Student Transport",
                onLogoutClick = onLogoutClick,
                actions = {
                    IconButton(onClick = { viewModel.loadAdminData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextPrimary)
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
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                if (uiState.errorMessage != null) {
                    item {
                        ErrorBanner(message = uiState.errorMessage!!)
                    }
                }

                // Metric Overview Cards
                item {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = DarkSurface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(PrimaryBlue.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.DirectionsBus, contentDescription = null, tint = PrimaryBlue, modifier = Modifier.size(20.dp))
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(text = "${uiState.totalBuses}", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                                Text(text = "Fleet Buses", fontSize = 12.sp, color = TextSecondary)
                            }
                        }

                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = DarkSurface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(SuccessEmerald.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Group, contentDescription = null, tint = SuccessEmerald, modifier = Modifier.size(20.dp))
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(text = "${uiState.totalStudents}", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
                                Text(text = "Students", fontSize = 12.sp, color = TextSecondary)
                            }
                        }
                    }
                }

                // Tab Switcher
                item {
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = DarkSurface,
                        contentColor = PrimaryBlue,
                        modifier = Modifier.clip(RoundedCornerShape(10.dp))
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = { Text("Fleet Buses (${uiState.buses.size})", fontWeight = FontWeight.Bold) }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = { Text("Students (${uiState.students.size})", fontWeight = FontWeight.Bold) }
                        )
                    }
                }

                if (selectedTab == 0) {
                    if (uiState.buses.isEmpty()) {
                        item {
                            Text(
                                text = "No fleet buses registered in system.",
                                color = TextMuted,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(vertical = 24.dp)
                            )
                        }
                    } else {
                        items(uiState.buses) { bus ->
                            GlassCard {
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.DirectionsBus, contentDescription = null, tint = PrimaryBlue, modifier = Modifier.size(24.dp))
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Column {
                                            Text(text = bus.busNumber, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                                            Text(text = "Reg: ${bus.registrationNumber ?: "AP-39-TJ-2026"}", fontSize = 12.sp, color = TextSecondary)
                                        }
                                    }
                                    val isRunning = bus.status.equals("RUNNING", ignoreCase = true)
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isRunning) SuccessEmerald.copy(alpha = 0.15f) else DarkSurfaceVariant)
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = bus.status ?: "NOT_STARTED",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isRunning) SuccessEmerald else TextSecondary
                                        )
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (uiState.students.isEmpty()) {
                        item {
                            Text(
                                text = "No students registered yet.",
                                color = TextMuted,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(vertical = 24.dp)
                            )
                        }
                    } else {
                        items(uiState.students) { student ->
                            GlassCard {
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column {
                                        Text(
                                            text = student.fullName ?: "Student",
                                            style = MaterialTheme.typography.titleMedium,
                                            color = TextPrimary
                                        )
                                        Text(
                                            text = "ID: ${student.studentId ?: "—"} • ${student.department ?: "Engineering"}",
                                            fontSize = 12.sp,
                                            color = TextSecondary
                                        )
                                    }
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(PrimaryBlue.copy(alpha = 0.15f))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = student.assignedBus ?: "No Bus",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = PrimaryBlue
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
