package com.kec.busconnect.ui.tracking

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.StopDto
import com.kec.busconnect.ui.theme.*
import kotlinx.coroutines.launch

/**
 * Native Google Maps Composable displaying the real-time bus marker, route polyline, and stop pins.
 */
@Composable
fun NativeMapView(
    liveStatus: LiveBusStatusDto?,
    stops: List<StopDto>,
    modifier: Modifier = Modifier
) {
    // Default fallback coordinates around KEC Kuppam campus (12.7483° N, 78.3619° E)
    val fallbackLat = 12.7483
    val fallbackLng = 78.3619

    val rawLat = liveStatus?.latitude
    val rawLng = liveStatus?.longitude

    val isValidLocation = rawLat != null && rawLng != null &&
            rawLat in -90.0..90.0 && rawLng in -180.0..180.0 &&
            !(rawLat == 0.0 && rawLng == 0.0)

    val busLat = if (isValidLocation) rawLat!! else fallbackLat
    val busLng = if (isValidLocation) rawLng!! else fallbackLng
    val busLocation = LatLng(busLat, busLng)

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(busLocation, 14.5f)
    }

    val coroutineScope = rememberCoroutineScope()
    var autoFollowEnabled by remember { mutableStateOf(true) }

    // Smoothly animate camera when bus location updates if auto-follow is active
    LaunchedEffect(busLocation) {
        if (autoFollowEnabled && isValidLocation) {
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLng(busLocation),
                durationMs = 1000
            )
        }
    }

    Box(modifier = modifier.fillMaxWidth().height(270.dp).clip(RoundedCornerShape(16.dp))) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            uiSettings = MapUiSettings(
                zoomControlsEnabled = true,
                myLocationButtonEnabled = false,
                compassEnabled = true,
                rotationGesturesEnabled = true,
                tiltGesturesEnabled = false
            ),
            properties = MapProperties(
                isMyLocationEnabled = false
            )
        ) {
            // 1. Bus Real-time Marker
            Marker(
                state = MarkerState(position = busLocation),
                title = "Bus ${liveStatus?.busNumber ?: "KEC-07"}",
                snippet = "Speed: ${liveStatus?.speed ?: 0.0} km/h • ${liveStatus?.currentlyAtStop ?: "In Transit"}"
            )

            // 2. Stop Markers
            stops.forEach { stop ->
                val lat = stop.latitude
                val lng = stop.longitude
                if (lat != null && lng != null && lat in -90.0..90.0 && lng in -180.0..180.0) {
                    Marker(
                        state = MarkerState(position = LatLng(lat, lng)),
                        title = stop.name,
                        snippet = "Stop seq: ${stop.sequence ?: 1}"
                    )
                }
            }

            // 3. Polyline connecting route stops
            val routePoints = stops.mapNotNull {
                val lat = it.latitude
                val lng = it.longitude
                if (lat != null && lng != null && lat in -90.0..90.0 && lng in -180.0..180.0) {
                    LatLng(lat, lng)
                } else null
            }

            if (routePoints.size >= 2) {
                Polyline(
                    points = routePoints,
                    color = PrimaryBlue,
                    width = 8f
                )
            }
        }

        // Floating Action: Recenter / Auto-follow Bus
        IconButton(
            onClick = {
                autoFollowEnabled = true
                coroutineScope.launch {
                    cameraPositionState.animate(
                        CameraUpdateFactory.newCameraPosition(
                            CameraPosition.fromLatLngZoom(busLocation, 15f)
                        ),
                        durationMs = 800
                    )
                }
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(12.dp)
                .size(42.dp)
                .background(DarkSurface.copy(alpha = 0.9f), CircleShape)
        ) {
            Icon(
                imageVector = Icons.Default.MyLocation,
                contentDescription = "Recenter Bus",
                tint = if (autoFollowEnabled) PrimaryBlue else TextSecondary,
                modifier = Modifier.size(20.dp)
            )
        }

        // Live Floating Speed Overlay
        Card(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(12.dp),
            shape = RoundedCornerShape(10.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface.copy(alpha = 0.9f))
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.DirectionsBus,
                    contentDescription = null,
                    tint = PrimaryBlue,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "${(liveStatus?.speed ?: 0.0).toInt()} km/h",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }
        }
    }
}

