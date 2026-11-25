# KomorebiSpace (Working Title)

> **Version 0.1: The Solo Time Engine**  
> A collaborative productivity platform designed to bridge the gap between individual time-tracking and community accountability.

KomorebiSpace helps students and self-learners organize, track focus hours via an integrated timer engine, visualize detailed analytics, and prepare for social study connections.

---

## 🏗️ High-Level System Architecture

The application is built using a decoupled client-server architecture:

```
+-------------------------------------------------------------+
|                        CLIENT LAYER                         |
|             React.js / Next.js SPA (Tailwind CSS v4)        |
+------------------------------+------------------------------+
                               |
            HTTP/REST (JSON)   |   WebSockets (Phase 2)
            [Auth, Analytics]  |   [Live Status, Leaderboards]
                               v
+-------------------------------------------------------------+
|                        BACKEND LAYER                        |
|                  Java 21 & Spring Boot 3.3                  |
|                                                             |
|  +--------------------+  +--------------------+  +---------+|
|  |  Spring Security   |  | Spring WebSockets  |  | Spring  ||
|  |     (JWT Auth)     |  | (Phase 2 Broker)   |  | Data JPA||
|  +--------------------+  +--------------------+  +---------+|
+------------------------------+------------------------------+
                               |
                               | Object-Relational Mapping (ORM)
                               v
+-------------------------------------------------------------+
|                       DATABASE LAYER                        |
|                  H2 / PostgreSQL Database                   |
+-------------------------------------------------------------+
```

---

## ⚡ Key Features (v0.1)

1. **Secure JWT Authentication**: Account creation and login handled statefully with secure password hashing (BCrypt) and stateless JSON Web Tokens.
2. **Smart Focus Timer**: A dual-mode Pomodoro / Stopwatch tracking component with category filtering. It syncs ticking states against epoch system timestamps in `localStorage`, protecting focus data from page refreshes and browser sleeps.
3. **Analytics Engine**: Integrates Recharts to render metric cards (total hours, streaks, averages), focus trend area charts with gradients, and track distribution pie charts.
4. **H2 In-Memory Database**: Configured in PostgreSQL-compatibility mode for zero-setup local development.

---

## 📂 Project Structure

```
KomorebiSpace/
├── backend/                  # Spring Boot Java Application
│   ├── src/main/java/com/komorebispace/
│   │   ├── config/          # JWT Filters, Security & CORS configs
│   │   ├── auth/            # JWT Register/Login entities, services, endpoints
│   │   ├── timer/           # Focus session log engine & saving
│   │   ├── analytics/       # Statistics trends & study streak calculation
│   │   ├── social/          # Placeholder for Phase 2 Social Groups
│   │   └── websocket/       # Placeholder for Phase 2 WebSocket Brokers
│   └── src/main/resources/
│       └── application.yml  # H2 database configurations and properties
├── frontend/                 # Next.js React Application
│   ├── src/
│   │   ├── app/             # App Router pages (/dashboard, /analytics, etc)
│   │   ├── components/      # Shared UI (Sidebar.tsx)
│   │   ├── context/         # AuthContext.tsx state provider
│   │   └── hooks/           # Future hooks folder
│   └── package.json         # Frontend configuration
├── requirements.txt         # System prerequisites
└── README.md                # Project documentation
```

---

## 🛠️ Prerequisites

Check your versions against [requirements.txt](file:///home/keshax/CSEx/KomorebiSpace/requirements.txt):
- **Java**: JDK 21+
- **Node.js**: Node 20.0.0+
- **NPM**: NPM 10.0.0+
- **Maven**: Maven 3.9.0+

---

## 🚀 How to Run Locally

### 1. Spring Boot Backend
Navigate to the `backend` folder and run the Maven Spring Boot plugin. The server will start on port `8080`.
```bash
cd backend
mvn spring-boot:run
```
* **H2 Database Console**: Open `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:komorebi_db`, Username: `sa`, Password: `password`) to run SQL commands directly.

### 2. Next.js Frontend
Navigate to the `frontend` folder, install the node modules, and start the development server. The frontend will start on port `3000`.
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to start focusing!

## Docker deployment

Production containers require Docker Engine and Docker Compose:

```bash
cp .env.example .env
# Replace the placeholder passwords and JWT secret in .env
docker compose up --build -d
```

The compose stack provides PostgreSQL, the Spring Boot backend, and the Next.js frontend.
Set `CORS_ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_BASE_URL` to the public frontend/backend URLs.
For a single public HTTPS domain, set `DOMAIN`, keep `NEXT_PUBLIC_API_BASE_URL=/api`, and start Caddy.

---

## 📡 API Endpoint Overview

### 🔐 Auth Module (`/api/auth`)
* `POST /api/auth/register` - Create a new user account.
* `POST /api/auth/login` - Authenticate credentials and get a JWT token.
* `GET /api/auth/me` - Retrieve current authenticated profile details.

### ⏱️ Time Module (`/api/logs`)
* `POST /api/logs/save` - Save a finished stopwatch/pomodoro study session (with clock skew tolerance).
* `GET /api/logs?limit={n}&page={p}` - Retrieve paginated study log history (default limit: 50).
* `GET /api/logs/today` - Retrieve aggregated focus seconds for the current day.

### 📈 Analytics Module (`/api/analytics`)
* `GET /api/analytics?days={count}` - Get aggregated focus stats (streaks, total times, trend arrays, category distributions). Default range is `7` days.

---

## 📝 License
This project is open-source and licensed under the MIT License.
