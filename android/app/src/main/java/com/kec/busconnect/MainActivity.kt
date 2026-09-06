package com.kec.busconnect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.kec.busconnect.ui.navigation.AppNavigation
import com.kec.busconnect.ui.theme.LightBackground
import com.kec.busconnect.ui.theme.KECBusConnectTheme

/**
 * Main Activity hosting the Jetpack Compose navigation graph.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KECBusConnectTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = LightBackground
                ) {
                    val navController = rememberNavController()
                    AppNavigation(
                        navController = navController,
                        context = this
                    )
                }
            }
        }
    }
}
