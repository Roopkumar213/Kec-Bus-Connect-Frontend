package com.kec.busconnect

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

/**
 * Main Application class for KEC BusConnect.
 * Responsible for initializing app-wide resources and creating Notification Channels for Android 8.0+ (API 26+).
 */
class BusConnectApplication : Application() {

    companion object {
        const val LOCATION_SERVICE_CHANNEL_ID = "bus_location_service_channel"
        const val REMINDER_CHANNEL_ID = "bus_arrival_reminder_channel"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. Foreground Service Channel for Bus Live Location Sharing
            val locationChannel = NotificationChannel(
                LOCATION_SERVICE_CHANNEL_ID,
                getString(R.string.location_service_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.location_service_channel_desc)
                setShowBadge(false)
            }

            // 2. High Priority Alert Channel for Student Arrival Reminders
            val reminderChannel = NotificationChannel(
                REMINDER_CHANNEL_ID,
                getString(R.string.reminder_channel_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = getString(R.string.reminder_channel_desc)
                enableVibration(true)
                setShowBadge(true)
            }

            notificationManager.createNotificationChannel(locationChannel)
            notificationManager.createNotificationChannel(reminderChannel)
        }
    }
}
