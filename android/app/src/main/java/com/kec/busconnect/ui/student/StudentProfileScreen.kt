package com.kec.busconnect.ui.student

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.ui.components.AppHeader
import com.kec.busconnect.ui.components.GlassCard
import com.kec.busconnect.ui.theme.*

@Composable
fun StudentProfileScreen(
    viewModel: StudentViewModel,
    onBackClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val student = uiState.student

    Scaffold(
        topBar = {
            AppHeader(
                title = "Student Profile",
                subtitle = "Boarding & Reminder Settings",
                onBackClick = onBackClick
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
            // Student Info Card
            GlassCard {
                Text(
                    text = "Personal Information",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(14.dp))

                ProfileInfoRow("Full Name", student?.fullName ?: "—")
                ProfileInfoRow("Roll / Student ID", student?.studentId ?: "—")
                ProfileInfoRow("Mobile Number", student?.mobile ?: "—")
                ProfileInfoRow("Program & Dept", "${student?.program ?: "—"} ${student?.department?.let { "• $it" } ?: ""}")
                ProfileInfoRow("Academic Year", "Year ${student?.academicYear ?: "—"} ${student?.section?.let { "• Sec $it" } ?: ""}")
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Bus & Stop Card
            var showStopModal by remember { mutableStateOf(false) }
            val corridorStops = com.kec.busconnect.data.repository.BusRepository.getDefaultMdr87Route().stops

            GlassCard {
                Text(
                    text = "Bus & Route Configuration",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(14.dp))

                val displayBus = if (student?.assignedBus?.startsWith("KEC") == true) student.assignedBus else "KEC-07"
                ProfileInfoRow("Assigned Bus", displayBus)
                ProfileInfoRow("Morning Boarding Stop", student?.assignedRoute ?: "Attikuppam (Origin)")
                ProfileInfoRow("Evening Drop Stop", student?.eveningDropAddress ?: student?.assignedRoute ?: "Attikuppam (Origin)")
                ProfileInfoRow("Arrival Reminder", "${student?.reminderMinutes ?: 10} minutes before arrival")

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = { showStopModal = true },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("CHANGE BOARDING STOP", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }

            if (showStopModal) {
                AlertDialog(
                    onDismissRequest = { showStopModal = false },
                    title = { Text("Select Boarding Stop", color = TextPrimary, fontWeight = FontWeight.Bold) },
                    text = {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 380.dp)
                                .verticalScroll(rememberScrollState())
                        ) {
                            corridorStops.forEachIndexed { idx, stop ->
                                val isSelected = stop.name == student?.assignedRoute
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 3.dp)
                                        .background(if (isSelected) PrimaryBlueLight else Color.Transparent, RoundedCornerShape(8.dp))
                                        .clickable {
                                            viewModel.updateBoardingStop(stop.name, stop.latitude ?: 12.884713, stop.longitude ?: 78.479812)
                                            showStopModal = false
                                        }
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .background(if (isSelected) PrimaryBlue else LightSurfaceVariant, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("${idx + 1}", color = if (isSelected) Color.White else TextSecondary, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(text = stop.name, color = if (isSelected) PrimaryBlue else TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                        if (stop.landmark != null) {
                                            Text(text = stop.landmark, color = TextMuted, fontSize = 11.sp)
                                        }
                                    }
                                    if (isSelected) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = PrimaryBlue, modifier = Modifier.size(20.dp))
                                    }
                                }
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { showStopModal = false }) {
                            Text("Done", color = PrimaryBlue, fontWeight = FontWeight.Bold)
                        }
                    },
                    containerColor = LightSurface
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onBackClick,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = LightSurfaceVariant, contentColor = TextPrimary),
                border = androidx.compose.foundation.BorderStroke(1.dp, LightCardBorder),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("BACK TO DASHBOARD", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ProfileInfoRow(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(text = label.uppercase(), fontSize = 10.sp, color = TextMuted, fontWeight = FontWeight.Bold)
        Text(text = value, fontSize = 14.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
    }
}
