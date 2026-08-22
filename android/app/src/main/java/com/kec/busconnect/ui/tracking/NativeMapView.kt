package com.kec.busconnect.ui.tracking

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.kec.busconnect.data.model.LiveBusStatusDto
import com.kec.busconnect.data.model.StopDto
import com.kec.busconnect.ui.theme.*
import kotlinx.coroutines.launch

/**
 * Universal Dual-Engine Map Component.
 * Supports Native Google Maps AND OpenStreetMap / Leaflet interactive map with real-time bus tracking.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun NativeMapView(
    liveStatus: LiveBusStatusDto?,
    stops: List<StopDto>,
    modifier: Modifier = Modifier
) {
    // Default fallback coordinates around Attikuppam origin / KEC corridor
    val fallbackLat = 12.884713
    val fallbackLng = 78.479812

    val rawLat = liveStatus?.latitude
    val rawLng = liveStatus?.longitude

    val isValidLocation = rawLat != null && rawLng != null &&
            rawLat in -90.0..90.0 && rawLng in -180.0..180.0 &&
            !(rawLat == 0.0 && rawLng == 0.0)

    val busLat = if (isValidLocation) rawLat!! else fallbackLat
    val busLng = if (isValidLocation) rawLng!! else fallbackLng
    val busLocation = LatLng(busLat, busLng)

    // Map Engine Mode: 0 = OpenStreetMap (Leaflet / 100% Reliable), 1 = Google Maps SDK
    var useOpenStreetMap by remember { mutableStateOf(true) }

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(busLocation, 14.5f)
    }

    val coroutineScope = rememberCoroutineScope()
    var autoFollowEnabled by remember { mutableStateOf(true) }

    // Animate Google Maps camera
    LaunchedEffect(busLocation) {
        if (autoFollowEnabled && isValidLocation) {
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLng(busLocation),
                durationMs = 1000
            )
        }
    }

    Box(modifier = modifier.fillMaxWidth().height(280.dp).clip(RoundedCornerShape(16.dp))) {
        if (useOpenStreetMap) {
            // OpenStreetMap / Leaflet Interactive Engine (Loads 100% reliably in all environments)
            val stopsJson = stops.mapNotNull { stop ->
                val lat = stop.latitude
                val lng = stop.longitude
                if (lat != null && lng != null) {
                    """{"name": "${stop.name.replace("\"", "\\\"")}", "lat": $lat, "lng": $lng, "seq": ${stop.sequence ?: 1}}"""
                } else null
            }.joinToString(",")

            val leafletHtml = remember(stopsJson) {
                """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                    <style>
                        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0f172a; }
                        .bus-marker {
                            width: 38px; height: 38px; border-radius: 50%;
                            background: #2563eb; color: white; display: flex;
                            align-items: center; justify-content: center;
                            font-size: 18px; border: 2px solid white;
                            box-shadow: 0 4px 12px rgba(37,99,235,0.6);
                        }
                        .stop-marker {
                            width: 22px; height: 22px; border-radius: 50%;
                            background: #0ea5e9; color: white; display: flex;
                            align-items: center; justify-content: center;
                            font-size: 11px; font-weight: bold; border: 2px solid white;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                        }
                    </style>
                </head>
                <body>
                    <div id="map"></div>
                    <script>
                        var map = L.map('map', { zoomControl: false }).setView([$busLat, $busLng], 14);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19,
                            attribution: '© OpenStreetMap'
                        }).addTo(map);

                        var stopsData = [$stopsJson];
                        var latlngs = [];

                        stopsData.forEach(function(s) {
                            var stopIcon = L.divIcon({
                                className: 'stop-icon',
                                html: '<div class="stop-marker">' + s.seq + '</div>',
                                iconSize: [22, 22],
                                iconAnchor: [11, 11]
                            });
                            L.marker([s.lat, s.lng], { icon: stopIcon }).addTo(map).bindPopup('<b>' + s.name + '</b>');
                            latlngs.push([s.lat, s.lng]);
                        });

                        if (latlngs.length >= 2) {
                            L.polyline(latlngs, { color: '#3b82f6', weight: 6, opacity: 0.85 }).addTo(map);
                        }

                        var busIcon = L.divIcon({
                            className: 'bus-icon',
                            html: '<div class="bus-marker">🚌</div>',
                            iconSize: [38, 38],
                            iconAnchor: [19, 19]
                        });

                        var busMarker = L.marker([$busLat, $busLng], { icon: busIcon }).addTo(map)
                            .bindPopup('<b>Bus ${liveStatus?.busNumber ?: "KEC-07"}</b><br>Speed: ${(liveStatus?.speed ?: 0.0).toInt()} km/h');

                        window.updateLocation = function(lat, lng, speed) {
                            if (busMarker) {
                                busMarker.setLatLng([lat, lng]);
                                busMarker.setPopupContent('<b>Bus ${liveStatus?.busNumber ?: "KEC-07"}</b><br>Speed: ' + Math.round(speed) + ' km/h');
                                map.panTo([lat, lng], { animate: true, duration: 0.8 });
                            }
                        };
                    </script>
                </body>
                </html>
                """.trimIndent()
            }

            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        webViewClient = WebViewClient()
                        loadDataWithBaseURL("https://openstreetmap.org", leafletHtml, "text/html", "UTF-8", null)
                    }
                },
                update = { webView ->
                    webView.evaluateJavascript("if (window.updateLocation) { window.updateLocation($busLat, $busLng, ${(liveStatus?.speed ?: 0.0)}); }", null)
                },
                modifier = Modifier.fillMaxSize()
            )
        } else {
            // Google Maps Native Engine
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
                properties = MapProperties(isMyLocationEnabled = false)
            ) {
                // Bus Marker
                Marker(
                    state = MarkerState(position = busLocation),
                    title = "Bus ${liveStatus?.busNumber ?: "KEC-07"}",
                    snippet = "Speed: ${liveStatus?.speed ?: 0.0} km/h • ${liveStatus?.currentlyAtStop ?: "In Transit"}"
                )

                // Stop Markers
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

                // Polyline connecting route stops
                val routePoints = stops.mapNotNull {
                    val lat = it.latitude
                    val lng = it.longitude
                    if (lat != null && lng != null && lat in -90.0..90.0 && lng in -180.0..180.0) {
                        LatLng(lat, lng)
                    } else null
                }

                if (routePoints.size >= 2) {
                    Polyline(points = routePoints, color = PrimaryBlue, width = 8f)
                }
            }
        }

        // Top Left: Map Engine Switcher (OSM / Google Maps)
        Card(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(12.dp),
            shape = RoundedCornerShape(8.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface.copy(alpha = 0.9f))
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { useOpenStreetMap = !useOpenStreetMap },
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Layers,
                        contentDescription = "Switch Map Engine",
                        tint = PrimaryBlue,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (useOpenStreetMap) "OpenStreetMap" else "Google Maps",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }
        }

        // Top Right: Live Speed Overlay
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

        // Bottom Right: Recenter Button
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
    }
}


