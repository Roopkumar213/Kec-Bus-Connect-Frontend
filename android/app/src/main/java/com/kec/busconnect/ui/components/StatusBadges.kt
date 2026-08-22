package com.kec.busconnect.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kec.busconnect.ui.theme.*

/**
 * Reusable Status Badges for LIVE / STALE / LOCATION DELAYED / TRIP DIRECTION.
 */

@Composable
fun FreshnessBadge(freshness: String?, modifier: Modifier = Modifier) {
    val (bgColor, textColor, label) = when (freshness?.uppercase()) {
        "LIVE" -> Triple(SuccessEmerald.copy(alpha = 0.15f), SuccessEmerald, "● LIVE")
        "STALE" -> Triple(AccentAmber.copy(alpha = 0.15f), AccentAmber, "● STALE")
        else -> Triple(DangerRose.copy(alpha = 0.15f), DangerRose, "● LOCATION DELAYED")
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, textColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun TripDirectionBadge(direction: String?, modifier: Modifier = Modifier) {
    val isEvening = direction?.uppercase() == "EVENING"
    val (bgColor, textColor, label) = if (isEvening) {
        Triple(PurpleEvening.copy(alpha = 0.15f), PurpleEvening, "🌆 EVENING TRIP")
    } else {
        Triple(PrimaryBlue.copy(alpha = 0.15f), PrimaryBlue, "🌅 MORNING TRIP")
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, textColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun SourceTypeBadge(sourceType: String?, modifier: Modifier = Modifier) {
    val (bgColor, textColor, label) = when (sourceType?.uppercase()) {
        "DRIVER" -> Triple(PrimaryBlue.copy(alpha = 0.15f), PrimaryBlue, "🚌 Driver GPS")
        "ADMIN" -> Triple(PurpleEvening.copy(alpha = 0.15f), PurpleEvening, "⚙️ Admin")
        "STUDENT" -> Triple(SuccessEmerald.copy(alpha = 0.15f), SuccessEmerald, "👤 Passenger Live")
        else -> Triple(DarkSurfaceVariant, TextSecondary, "📡 Automatic")
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, textColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
