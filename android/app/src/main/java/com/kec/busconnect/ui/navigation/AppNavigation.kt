package com.kec.busconnect.ui.navigation

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.kec.busconnect.data.api.ApiClient
import com.kec.busconnect.data.local.SessionManager
import com.kec.busconnect.data.repository.*
import com.kec.busconnect.ui.admin.AdminDashboardScreen
import com.kec.busconnect.ui.admin.AdminViewModel
import com.kec.busconnect.ui.driver.DriverDashboardScreen
import com.kec.busconnect.ui.driver.DriverViewModel
import com.kec.busconnect.ui.login.LoginScreen
import com.kec.busconnect.ui.login.LoginViewModel
import com.kec.busconnect.ui.student.StudentDashboardScreen
import com.kec.busconnect.ui.student.StudentProfileScreen
import com.kec.busconnect.ui.student.StudentViewModel
import com.kec.busconnect.ui.tracking.BusTrackingScreen
import com.kec.busconnect.ui.tracking.TrackingViewModel

/**
 * Top-level Jetpack Compose Navigation Graph for KEC BusConnect.
 */
@Composable
fun AppNavigation(
    navController: NavHostController,
    context: Context
) {
    val sessionManager = SessionManager(context)
    val apiService = ApiClient.getService(context)

    // Repositories
    val authRepo = AuthRepository(apiService, sessionManager)
    val busRepo = BusRepository(apiService)
    val studentRepo = StudentRepository(apiService, sessionManager)
    val driverRepo = DriverRepository(apiService)
    val adminRepo = AdminRepository(apiService)

    // factories
    val loginViewModelFactory = viewModelFactory {
        initializer { LoginViewModel(authRepo) }
    }
    val studentViewModelFactory = viewModelFactory {
        initializer { StudentViewModel(studentRepo, busRepo) }
    }
    val driverViewModelFactory = viewModelFactory {
        initializer { DriverViewModel(driverRepo) }
    }
    val adminViewModelFactory = viewModelFactory {
        initializer { AdminViewModel(adminRepo) }
    }
    val trackingViewModelFactory = viewModelFactory {
        initializer { TrackingViewModel(busRepo, studentRepo) }
    }

    // Initial destination based on saved session
    val startDestination = if (sessionManager.isLoggedIn()) {
        when (sessionManager.getUserRole()?.uppercase()) {
            "DRIVER", "TRACKER" -> Screen.DriverDashboard.route
            "ADMIN" -> Screen.AdminDashboard.route
            else -> Screen.StudentDashboard.route
        }
    } else {
        Screen.Login.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // 1. Login Screen
        composable(Screen.Login.route) {
            val loginViewModel: LoginViewModel = viewModel(factory = loginViewModelFactory)
            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = { response ->
                    val role = response.user?.role?.uppercase() ?: "STUDENT"
                    val targetRoute = when (role) {
                        "DRIVER", "TRACKER" -> Screen.DriverDashboard.route
                        "ADMIN" -> Screen.AdminDashboard.route
                        else -> Screen.StudentDashboard.route
                    }
                    navController.navigate(targetRoute) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // 2. Student Dashboard
        composable(Screen.StudentDashboard.route) {
            val studentViewModel: StudentViewModel = viewModel(factory = studentViewModelFactory)
            StudentDashboardScreen(
                viewModel = studentViewModel,
                onTrackBusClick = { busNumber ->
                    navController.navigate(Screen.BusTracking.createRoute(busNumber))
                },
                onProfileClick = {
                    navController.navigate(Screen.StudentProfile.route)
                },
                onLogoutClick = {
                    authRepo.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // 3. Student Profile Screen
        composable(Screen.StudentProfile.route) {
            val studentViewModel: StudentViewModel = viewModel(factory = studentViewModelFactory)
            StudentProfileScreen(
                viewModel = studentViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        // 4. Driver Dashboard
        composable(Screen.DriverDashboard.route) {
            val driverViewModel: DriverViewModel = viewModel(factory = driverViewModelFactory)
            val user = authRepo.getStudent()
            LaunchedEffect(Unit) {
                driverViewModel.loadActiveTrip(user?.assignedBus ?: "KEC-07")
            }
            DriverDashboardScreen(
                viewModel = driverViewModel,
                onLogoutClick = {
                    authRepo.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // 5. Admin Dashboard
        composable(Screen.AdminDashboard.route) {
            val adminViewModel: AdminViewModel = viewModel(factory = adminViewModelFactory)
            AdminDashboardScreen(
                viewModel = adminViewModel,
                onLogoutClick = {
                    authRepo.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // 6. Live Bus Tracking & Map
        composable(
            route = Screen.BusTracking.route,
            arguments = listOf(navArgument("busNumber") { type = NavType.StringType })
        ) { backStackEntry ->
            val busNumber = backStackEntry.arguments?.getString("busNumber") ?: "KEC-07"
            val trackingViewModel: TrackingViewModel = viewModel(factory = trackingViewModelFactory)
            BusTrackingScreen(
                busNumber = busNumber,
                viewModel = trackingViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
