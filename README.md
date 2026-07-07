# Hesteka Partner Dashboard

A premium, responsive React web application built with Vite and TailwindCSS/Vanilla CSS design systems. The Hesteka Partner Dashboard is tailored for partners to register their organization, manage collection points (ads), create local missions, track participants, and receive real-time system alerts.

---

## 🚀 Key Features

* **Multi-Step Onboarding Wizard:** Interactive registration workflow collecting representative details, company information, geolocation coordinates, and custom media uploads (logo and cover banner).
* **Interactive Geolocation Map:** Built-in Google Maps integration mapping partner collection points. Click to zoom, highlight, and view specific location metadata.
* **Collection Point Management (CRUD):** Fully-featured dashboard to create, read, update, and delete deposit sites, with image uploads and address localization.
* **Local Missions Control:** Manage volunteer tasks, define categories, specify point rewards, view registered participants, and approve registration requests.
* **Real-time Notifications:** Real-time event synchronizations using WebSockets (`socket.io-client`) and Firebase Cloud Messaging (FCM) push notification listener.
* **Bilingual Parity:** Seamless toggle system between English (EN) and French (FR) stored in local storage.
* **Secure Session Checks:** Role-based (`partners` only) route guards that verify credentials and ensure accounts are in an `active` state.

---

## 🛠️ Tech Stack

* **Build Tool:** Vite
* **Core:** React 18 & JavaScript (ES6+)
* **Routing:** React Router DOM v6
* **State & Networking:** Context API, Axios, Socket.io-client, Firebase Client SDK
* **Styling:** Vanilla CSS & TailwindCSS utilities
* **Icons:** Lucide React
* **Feedback:** React Toastify

---

## 📁 Folder Structure

```
hestekaPartnerDashboard/
├── public/
│   ├── firebase-messaging-sw.js  # Background service worker for FCM alerts
│   └── images/                   # Local media assets
├── src/
│   ├── components/
│   │   ├── common/               # Reusable tables, badges, and modals
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── FCMListener.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatusBadge.jsx
│   │   └── dashboard/            # Layout widgets
│   │       ├── MapCard.jsx
│   │       ├── Sidebar.jsx
│   │       ├── StatCard.jsx
│   │       └── Topbar.jsx
│   ├── context/                  # Global providers
│   │   ├── ApiCacheContext.jsx
│   │   ├── LanguageContext.jsx
│   │   └── SocketContect.jsx
│   ├── layouts/
│   │   └── DashboardLayout.jsx   # Layout wrapper containing Topbar and Sidebar
│   ├── pages/                    # Portal page views
│   │   ├── CollectionPointsPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── MissionsPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── PartnerLoginPage.jsx
│   │   ├── PartnerRegisterPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   └── SettingsPage.jsx
│   ├── utils/
│   │   └── api.js                # Custom network clients with auto-interceptors
│   ├── App.jsx                   # Main Router
│   ├── App.css                   # Global dashboard custom styles
│   ├── index.css                 # Base resets and styles
│   └── main.jsx                  # Virtual DOM root mounter
├── .env                          # Configuration keys
├── package.json
└── vite.config.js
```

---

## ⚙️ Configuration (.env)

Create a `.env` file in the root of the project with the following keys:

```env
# API Base Endpoint
VITE_API_BASE_URL=http://localhost:5000/api/v1

# Real-time WebSocket Gateway
VITE_SOCKET_URL=http://localhost:5000

# Google Maps Platform Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Firebase SDK configuration
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_public_vapid_key
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Navigate to the directory and install required npm packages:
```bash
npm install
```

### 2. Run Local Development Server
Launch the Vite hot-reloading dev server:
```bash
npm run dev
```
The application will be served locally, typically at `http://localhost:5173`.

### 3. Build for Production
Bundle and optimize assets for deployment:
```bash
npm run build
```
The build artifacts will be output to the `/dist` folder.
