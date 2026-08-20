# KEC BusConnect — Frontend (V1 Live Pilot)

> **Real-Time College Bus Tracking Platform for Kuppam Engineering College (KEC)**  
> Built with React, Vite, Leaflet OpenStreetMap, and STOMP WebSocket client.

---

## 🌟 Features

- 🚌 **Live Bus Tracking:** Real-time bus telemetry, Leaflet live map markers, and speed indicators.
- ⏱️ **Real-Time ETA & Distance:** Dynamic Haversine distance and accurate ETA calculations relative to each student's boarding stop.
- 🗺️ **GPS Geolocation & Reverse Geocoding:** Auto-captures student boarding locations with Nominatim OpenStreetMap human-readable addresses.
- 👥 **Role-Based Portals:**
  - **Student Portal:** Academic profiles, boarding stop selector, live bus tracking, and "I'm On Board" check-in.
  - **Driver GPS Broadcaster:** Continuous `watchPosition` GPS broadcasting directly to the Spring Boot STOMP broker.
  - **Admin Console:** Fleet management, registered student directory, and driver rosters.

---




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



---

## 📄 License
Kuppam Engineering College — KEC BusConnect Platform.
