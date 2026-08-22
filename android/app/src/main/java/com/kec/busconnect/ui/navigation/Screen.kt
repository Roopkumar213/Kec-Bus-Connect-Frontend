package com.kec.busconnect.ui.navigation

/**
 * Sealed class representing all navigation destinations in the application.
 */
sealed class Screen(val route: String) {
    object Login : Screen("login")
    object StudentDashboard : Screen("student_dashboard")
    object StudentProfile : Screen("student_profile")
    object DriverDashboard : Screen("driver_dashboard")
    object AdminDashboard : Screen("admin_dashboard")
    
    // Dynamic Tracking Route with busNumber argument
    object BusTracking : Screen("bus_tracking/{busNumber}") {
        fun createRoute(busNumber: String): String = "bus_tracking/$busNumber"
    }
}
