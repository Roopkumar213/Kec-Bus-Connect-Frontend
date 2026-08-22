package com.kec.busconnect.location

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.google.android.gms.location.*
import com.kec.busconnect.BusConnectApplication
import com.kec.busconnect.MainActivity
import com.kec.busconnect.R
import com.kec.busconnect.data.api.ApiClient
import com.kec.busconnect.data.local.SessionManager
import com.kec.busconnect.data.model.LocationUpdateRequest
import kotlinx.coroutines.*

/**
 * Android Foreground Service responsible for continuous GPS location sharing.
 *
 * Why a Foreground Service?
 * Modern Android (Android 8.0 through Android 14+) strictly terminates background threads
 * when the app is minimized or the screen is locked to save battery. A Foreground Service with
 * foregroundServiceType="location" is the official Android mechanism to ensure uninterrupted GPS updates
 * while showing a mandatory ongoing notification to the user.
 */
class BusLocationForegroundService : Service() {

    companion object {
        private const val TAG = "BusLocationService"
        private const val NOTIFICATION_ID = 1001

        const val ACTION_START_SHARING = "com.kec.busconnect.ACTION_START_SHARING"
        const val ACTION_STOP_SHARING = "com.kec.busconnect.ACTION_STOP_SHARING"

        const val EXTRA_BUS_ID = "extra_bus_id"
        const val EXTRA_BUS_NUMBER = "extra_bus_number"

        // Helper to start the service from any Activity or Composable
        fun start(context: Context, busId: String, busNumber: String) {
            val intent = Intent(context, BusLocationForegroundService::class.java).apply {
                action = ACTION_START_SHARING
                putExtra(EXTRA_BUS_ID, busId)
                putExtra(EXTRA_BUS_NUMBER, busNumber)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, BusLocationForegroundService::class.java).apply {
                action = ACTION_STOP_SHARING
            }
            context.startService(intent)
        }
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var sessionManager: SessionManager

    private var activeBusId: String? = null
    private var activeBusNumber: String? = null
    private var isTracking = false

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager(applicationContext)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    handleNewLocation(location)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        when (action) {
            ACTION_START_SHARING -> {
                val busId = intent?.getStringExtra(EXTRA_BUS_ID) ?: sessionManager.getActiveSharingBusId()
                val busNumber = intent?.getStringExtra(EXTRA_BUS_NUMBER) ?: "Bus"
                if (!busId.isNullOrBlank()) {
                    startLocationTracking(busId, busNumber)
                } else {
                    stopSelf()
                }
            }
            ACTION_STOP_SHARING -> {
                stopLocationTracking()
                stopSelf()
            }
            else -> {
                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    private fun startLocationTracking(busId: String, busNumber: String) {
        if (isTracking) return
        isTracking = true
        activeBusId = busId
        activeBusNumber = busNumber
        sessionManager.setActiveSharingBusId(busId)

        // 1. Promote to Foreground Service with persistent notification
        val notification = buildOngoingNotification("Sharing live location for $busNumber…", null)
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceCompat.startForeground(
                    this,
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start foreground service: ${e.message}", e)
        }

        // 2. Request Location updates every 6 seconds (high accuracy)
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            6000L // 6 seconds interval
        ).apply {
            setMinUpdateIntervalMillis(4000L) // Fastest update 4 seconds
            setMinUpdateDistanceMeters(3f)     // 3 meters displacement
            setWaitForAccurateLocation(false)
        }.build()

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            Log.d(TAG, "Location updates started for bus: $busId")
        } catch (unlikely: SecurityException) {
            Log.e(TAG, "Location permission missing in Service: ${unlikely.message}")
            stopSelf()
        }
    }

    private fun handleNewLocation(location: Location) {
        val busId = activeBusId ?: return
        val busNumber = activeBusNumber ?: "Bus"

        // Speed calculation: location.speed is in m/s, convert to km/h
        val speedKmh = if (location.hasSpeed()) (location.speed * 3.6).toDouble() else 0.0
        val heading = if (location.hasBearing()) location.bearing.toDouble() else null
        val accuracy = if (location.hasAccuracy()) location.accuracy.toDouble() else null

        // Update ongoing notification with current speed
        val statusText = if (speedKmh > 1.0) {
            "Sharing live GPS for $busNumber • %.0f km/h".format(speedKmh)
        } else {
            "Sharing live GPS for $busNumber • At stop / stationary"
        }
        updateNotification(statusText)

        // Send to Spring Boot Backend
        serviceScope.launch {
            try {
                val apiService = ApiClient.getService(applicationContext)
                val updateRequest = LocationUpdateRequest(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    accuracy = accuracy,
                    speed = speedKmh,
                    heading = heading
                )
                val response = apiService.updateBusLocation(busId, updateRequest)
                if (!response.isSuccessful) {
                    Log.w(TAG, "Backend rejected location update: code ${response.code()}")
                    if (response.code() == 400 || response.code() == 403) {
                        // Driver took priority or student unauthorized -> auto stop
                        withContext(Dispatchers.Main) {
                            stopLocationTracking()
                            stopSelf()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Transient network error sending location: ${e.message}")
            }
        }
    }

    private fun stopLocationTracking() {
        if (!isTracking) return
        isTracking = false
        val busId = activeBusId

        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing location updates: ${e.message}")
        }

        // Notify backend that student has stopped sharing
        if (!busId.isNullOrBlank()) {
            serviceScope.launch {
                try {
                    val apiService = ApiClient.getService(applicationContext)
                    apiService.stopStudentLocationSharing(busId)
                } catch (e: Exception) {
                    Log.w(TAG, "Error notifying backend of stop sharing: ${e.message}")
                }
            }
        }

        sessionManager.setActiveSharingBusId(null)
        activeBusId = null
        activeBusNumber = null
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    private fun buildOngoingNotification(content: String, speedText: String?): Notification {
        // Intent to open app when user taps notification
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action to STOP sharing directly from the notification shade
        val stopIntent = Intent(this, BusLocationForegroundService::class.java).apply {
            action = ACTION_STOP_SHARING
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, BusConnectApplication.LOCATION_SERVICE_CHANNEL_ID)
            .setContentTitle("KEC BusConnect")
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setOngoing(true)
            .setContentIntent(openAppPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Sharing", stopPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun updateNotification(content: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildOngoingNotification(content, null))
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationTracking()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
