package com.kec.busconnect.ui.tracking

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.StopDto
import com.kec.busconnect.ui.theme.*

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
    val busLat = liveStatus?.latitude ?: 12.7483
    val busLng = liveStatus?.longitude ?: 78.3619
    val busLocation = LatLng(busLat, busLng)

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(busLocation, 14f)
    }

    Box(modifier = modifier.fillMaxWidth().height(260.dp).clip(RoundedCornerShape(16.dp))) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            uiSettings = MapUiSettings(
                zoomControlsEnabled = true,
                myLocationButtonEnabled = false,
                compassEnabled = true
            ),
            properties = MapProperties(
                isMyLocationEnabled = false
            )
        ) {
            // 1. Bus Real-time Marker
            Marker(
                state = MarkerState(position = busLocation),
                title = "Bus: ${liveStatus?.busNumber ?: "KEC-07"}",
                snippet = "Speed: ${liveStatus?.speed ?: 0.0} km/h • ${liveStatus?.currentlyAtStop ?: "In Transit"}"
            )

            // 2. Stop Markers
            stops.forEach { stop ->
                val lat = stop.latitude
                val lng = stop.longitude
                if (lat != null && lng != null) {
                    Marker(
                        state = MarkerState(position = LatLng(lat, lng)),
                        title = stop.name,
                        snippet = "Stop seq: ${stop.sequence ?: 1}"
                    )
                }
            }

            // 3. Polyline connecting route stops
            val routePoints = stops.mapNotNull {
                if (it.latitude != null && it.longitude != null) LatLng(it.latitude!!, it.longitude!!) else null
            }
            if (routePoints.size >= 2) {
                Polyline(
                    points = routePoints,
                    color = PrimaryBlue,
                    width = 8f
                )
            }
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
