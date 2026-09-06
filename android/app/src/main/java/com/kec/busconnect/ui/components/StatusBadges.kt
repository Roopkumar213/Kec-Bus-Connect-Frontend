package com.kec.busconnect.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
    val (bgColor, textColor, borderColor, label) = when (freshness?.uppercase()) {
        "LIVE" -> Quadruple(SuccessEmeraldLight, SuccessEmerald, SuccessEmerald.copy(alpha = 0.3f), "● LIVE")
        "STALE" -> Quadruple(AccentAmberLight, AccentAmber, AccentAmber.copy(alpha = 0.3f), "● STALE")
        else -> Quadruple(DangerRoseLight, DangerRose, DangerRose.copy(alpha = 0.3f), "● LOCATION DELAYED")
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
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
    val (bgColor, textColor, borderColor, label) = if (isEvening) {
        Quadruple(PurpleEveningLight, PurpleEvening, PurpleEvening.copy(alpha = 0.3f), "🌆 EVENING TRIP")
    } else {
        Quadruple(PrimaryBlueLight, PrimaryBlue, PrimaryBlueBorder, "🌅 MORNING TRIP")
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
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
    val (bgColor, textColor, borderColor, label) = when (sourceType?.uppercase()) {
        "DRIVER" -> Quadruple(PrimaryBlueLight, PrimaryBlue, PrimaryBlueBorder, "🚌 Driver GPS")
        "ADMIN" -> Quadruple(PurpleEveningLight, PurpleEvening, PurpleEvening.copy(alpha = 0.3f), "⚙️ Admin GPS")
        "STUDENT" -> Quadruple(SuccessEmeraldLight, SuccessEmerald, SuccessEmerald.copy(alpha = 0.3f), "👤 Passenger Live")
        else -> Quadruple(LightSurfaceVariant, TextSecondary, LightCardBorder, "📡 System Telemetry")
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
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

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

