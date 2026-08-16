# KEC BusConnect — Frontend (V1 Live Pilot)

> **Real-Time College Bus Tracking Platform for Kuppam Engineering College (KEC)**  
> Built with React, Vite, Leaflet OpenStreetMap, and STOMP WebSocket client.

---

## 🌟 Features

- 🚌 **Live Bus Tracking:** Real-time bus telemetry, Leaflet live map markers, and speed indicators.
- 📍 **Official Route Corridor:** Dedicated single-route pilot (**`Attikuppam → KEC via MDR87`**, 16 stops, 39.8 km).
- ⏱️ **Real-Time ETA & Distance:** Dynamic Haversine distance and accurate ETA calculations relative to each student's boarding stop.
- 🗺️ **GPS Geolocation & Reverse Geocoding:** Auto-captures student boarding locations with Nominatim OpenStreetMap human-readable addresses.
- 👥 **Role-Based Portals:**
  - **Student Portal:** Academic profiles, boarding stop selector, live bus tracking, and "I'm On Board" check-in.
  - **Driver GPS Broadcaster:** Continuous `watchPosition` GPS broadcasting directly to the Spring Boot STOMP broker.
  - **Admin Console:** Fleet management, registered student directory, and driver rosters.

---

## 🗺️ Official Bus & Route Specifications

- **Bus Number:** `KEC-07` (Registration: `AP-39-TJ-2026`)
- **Route Name:** `Attikuppam → KEC (via MDR87)`
- **Total Route Distance:** `39.8 km`
- **Estimated Duration:** `1 hour, 18 minutes`

### Official 16 Stops & Waypoints:
1. **Attikuppam (Origin)** — `12.884713, 78.479812` (0.0 km)
2. **Manendram Village Stop** — `12.878439, 78.481943` (0.8 km)
3. **Balaobanapalle Northern Junction** — `12.835211, 78.472352` (5.7 km)
4. **Singasamudram Center** — `12.833760, 78.503606` (9.1 km)
5. **Kenchanaballa (Loop Terminus)** — `12.828577, 78.482298` (11.8 km)
6. **Singasamudram (Return Pass-through)** — `12.833760, 78.503606` (14.5 km)
7. **Balaobanapalle Junction (Return Axis)** — `12.835211, 78.472352` (17.9 km)
8. **Vijayapuram (Vijalapuram)** — `12.841468, 78.453880` (20.0 km)
9. **Aniganur (Sachivalayam Stop)** — `12.822435, 78.456689` (22.2 km)
10. **Govindapalle** — `12.813177, 78.453880` (23.3 km)
11. **Lingapuram** — `12.802100, 78.449500` (24.6 km)
12. **Ramalagutta Chenu** — `12.783400, 78.441200` (26.8 km)
13. **Kangundhi** — `12.768058, 78.432970` (28.7 km)
14. **Dase Gownur Crossing** — `12.752300, 78.388100` (33.7 km)
15. **Kuppam Town Center** — `12.739798, 78.345572` (38.3 km)
16. **Kuppam Engineering College (KEC - Terminus)** — `12.721662, 78.360311` (39.8 km)

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```properties
VITE_API_URL=http://localhost:8081/api
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🌐 Production Deployment

### Deploying to Vercel (Recommended)
1. Import repository `https://github.com/Roopkumar213/Kec-Bus-Connect-Frontend`.
2. Framework Preset: **Vite**.
3. Environment Variables:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
4. Click **Deploy**.

---

## 🔒 Credentials for Testing

| Role | Email | Password |
|---|---|---|
| **Student** | `student@kec.ac.in` | `password` |
| **Driver** | `driver@kec.ac.in` | `password` |
| **Admin** | `admin@kec.ac.in` | `admin123` |

---

## 📄 License
Kuppam Engineering College — KEC BusConnect Platform.
