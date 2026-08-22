package com.kec.busconnect.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.ui.components.AppHeader
import com.kec.busconnect.ui.components.GlassCard
import com.kec.busconnect.ui.theme.*

@Composable
fun AdminDashboardScreen(
    viewModel: AdminViewModel,
    onLogoutClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            AppHeader(
                title = "Admin Console",
                subtitle = "Fleet & Student Management",
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
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Metric Summary Cards
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
                                Icon(Icons.Default.DirectionsBus, contentDescription = null, tint = PrimaryBlue)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "${uiState.totalBuses}", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text(text = "Total Fleet Buses", fontSize = 12.sp, color = TextSecondary)
                            }
                        }

                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = DarkSurface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Icon(Icons.Default.Group, contentDescription = null, tint = SuccessEmerald)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "${uiState.totalStudents}", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text(text = "Registered Students", fontSize = 12.sp, color = TextSecondary)
                            }
                        }
                    }
                }

                // Buses List Section
                item {
                    Text(
                        text = "FLEET BUSES",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMuted,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                items(uiState.buses) { bus ->
                    GlassCard {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column {
                                Text(text = bus.busNumber, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                                Text(text = "Reg: ${bus.registrationNumber ?: "AP 39 X 1234"}", fontSize = 12.sp, color = TextSecondary)
                            }
                            Text(text = bus.status ?: "NOT_STARTED", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PrimaryBlue)
                        }
                    }
                }
            }
        }
    }
}
