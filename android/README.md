# KEC BusConnect — Native Android Application

Native Android client for KEC BusConnect built with **Kotlin, Jetpack Compose, Material 3, and Google Play Services Location**.

---

## 📱 Features

1. **Authentication & Roles:**
   - Single Login screen for **Student**, **Driver**, and **Admin**.
   - Dynamic routing based on the role returned by the Spring Boot backend.
   - Secure token storage via `SessionManager`.

2. **Student Console:**
   - View assigned bus, route, and boarding/drop stop.
   - Real-time bus status and telemetry preview.
   - One-tap navigation to live bus tracking map.
   - Respond to Driver boarding checks.

3. **Driver Console:**
   - Start Morning / Evening trips.
   - Automatic live GPS sharing to server.
   - Broadcast boarding confirmation requests to students.
   - Stop trip with real-time passenger counts.

4. **Live Bus Tracking & Map:**
   - Google Maps view showing live bus pin, route polyline, and stop pins.
   - Live speed (km/h), current stop, next stop, and ETA.
   - Freshness indicators: `LIVE` (<30s), `STALE` (30-180s), `LOCATION DELAYED` (>180s).

5. **Student Bus Location Sharing (Foreground Service):**
   - Authorized students on board can share the bus's live GPS.
   - Runs via an Android **Foreground Service** (`BusLocationForegroundService`) with an ongoing notification.
   - **Continues sending GPS updates even when the screen is locked or the app is minimized.**
   - Priority hierarchy enforced: **DRIVER > ADMIN > STUDENT**.
   - Stop sharing button with automatic cleanup.

---

## 🛠 Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml          # Permissions (Location, Foreground Service, Notifications)
│   │   └── java/com/kec/busconnect/
│   │       ├── BusConnectApplication.kt  # Notification channels setup
│   │       ├── MainActivity.kt           # Jetpack Compose single Activity
│   │       ├── data/
│   │       │   ├── api/                  # Retrofit ApiService, ApiClient, AuthInterceptor
│   │       │   ├── local/                # SessionManager (Secure SharedPreferences)
│   │       │   ├── model/                # Data models matching Spring Boot backend
│   │       │   └── repository/           # Auth, Bus, Student, Driver, Admin repositories
│   │       ├── location/
│   │       │   ├── BusLocationForegroundService.kt # Foreground service with persistent notification
│   │       │   └── LocationHelper.kt     # GPS permission helper
│   │       └── ui/
│   │           ├── theme/                # Modern dark theme (Color, Type, Theme)
│   │           ├── navigation/           # Screen routes & NavHost
│   │           ├── login/                # LoginScreen & LoginViewModel
│   │           ├── student/              # StudentDashboardScreen & StudentProfileScreen
│   │           ├── driver/               # DriverDashboardScreen
│   │           ├── admin/                # AdminDashboardScreen
│   │           ├── tracking/             # BusTrackingScreen & NativeMapView
│   │           └── components/           # Reusable status badges, glass cards, error banners
```

---

## 🚀 How to Run in Android Studio

1. Open **Android Studio** (Hedgehog, Iguana, Jellyfish, or newer).
2. Select **File → Open...** and choose the `android/` directory.
3. Wait for **Gradle Sync** to finish downloading dependencies.
4. Connect an Android phone (or start an Emulator with Google Play Services).
5. Click the green **Run (▶)** button.

---

## 🌐 Connecting to Backend

In `app/src/main/java/com/kec/busconnect/data/api/ApiClient.kt`:

- **Production (Default):**
  ```kotlin
  const val DEFAULT_BASE_URL = "https://kec-bus-connect-backend.onrender.com/api/"
  ```
- **Local Android Emulator:**
  ```kotlin
  const val DEFAULT_BASE_URL = "http://10.0.2.2:8080/api/"
  ```
- **Local Physical Phone (via Wi-Fi):**
  ```kotlin
  const val DEFAULT_BASE_URL = "http://192.168.X.X:8080/api/"
  ```

---

## 🗺️ Google Maps Setup

To enable Google Maps:
1. Get a free Android Maps API key from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).
2. In `app/build.gradle.kts` (or in your `local.properties`), specify your key:
   ```kotlin
   manifestPlaceholders["MAPS_API_KEY"] = "YOUR_ACTUAL_GOOGLE_MAPS_API_KEY"
   ```

---

## 📦 How to Generate an APK

In Android Studio:
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
2. The generated APK will be available in `app/build/outputs/apk/debug/app-debug.apk`.
3. Copy this APK to your phone and install it directly.
