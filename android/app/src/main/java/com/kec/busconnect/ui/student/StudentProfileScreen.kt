package com.kec.busconnect.ui.student

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
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
        containerColor = DarkBackground
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
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(12.dp))

                ProfileInfoRow("Full Name", student?.fullName ?: "—")
                ProfileInfoRow("Roll / Student ID", student?.studentId ?: "—")
                ProfileInfoRow("Mobile", student?.mobile ?: "—")
                ProfileInfoRow("Program & Dept", "${student?.program ?: "—"} ${student?.department?.let { "• $it" } ?: ""}")
                ProfileInfoRow("Academic Year", "Year ${student?.academicYear ?: "—"} ${student?.section?.let { "• Sec $it" } ?: ""}")
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Bus & Stop Card
            GlassCard {
                Text(
                    text = "Bus & Route Configuration",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(12.dp))

                ProfileInfoRow("Assigned Bus", student?.assignedBus ?: "Not Assigned")
                ProfileInfoRow("Morning Boarding Stop", student?.assignedRoute ?: "Attikuppam (Origin)")
                ProfileInfoRow("Evening Drop Stop", student?.eveningDropAddress ?: student?.assignedRoute ?: "Attikuppam (Origin)")
                ProfileInfoRow("Arrival Reminder", "${student?.reminderMinutes ?: 10} minutes before stop")
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onBackClick,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
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
