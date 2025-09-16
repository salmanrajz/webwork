# WebWork – Employee Time Tracking & Team Management SaaS

Modern full-stack SaaS application for managing teams, projects, and time tracking with rich dashboards and reporting.

## Tech Stack

- **Backend:** Node.js, Express.js, Sequelize ORM, PostgreSQL
- **Frontend:** React (Vite) + TailwindCSS, React Router, Recharts
- **Auth:** JWT with role-based access control (Admin, Manager, Employee)

## Features

- Secure authentication with hashed passwords and JWT sessions
- Role-based access for Admin, Manager, and Employee actions
- User, team, project, task, and time log CRUD endpoints
- Real-time timer controls (start, pause, resume, stop) for time tracking
- Automated screenshot capture tied to active timers via the desktop tracker
- Daily, weekly, and monthly timesheets with summaries and exports-ready data
- Detailed user and project reports with aggregations
- Admin dashboard with charts for top performers and project utilization
- React dashboard with Tailwind styling, interactive charts, and productivity views
- Seed data for demo users, teams, projects, tasks, and logs
- Activity intelligence: automatic active-window tracking, idle detection, keyboard/mouse metrics (with optional keystroke logging), CPU usage sampling, and productivity scoring
- Attendance & scheduling: agent clock-in/out, shift management, and adherence tracking
- Real-time monitoring dashboard with live member status, app usage, and active task visibility

## Project Structure

```
webwork/
├── backend/            # Express API, Sequelize models, services, controllers
├── frontend/           # React + Vite client application
├── desktop/            # Electron-based tracker that captures screenshots
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+

### Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed    # resets DB and inserts demo data
npm run dev     # starts server on http://localhost:4000

# Uploaded screenshots are served at http://localhost:4000/uploads
```

The server exposes REST endpoints under `/api`. Key routes include:

- `POST /api/auth/login`, `POST /api/auth/register`
- `GET /api/users/me`, `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`
- `GET /api/teams`, `POST /api/teams`, `POST /api/teams/:id/members`
- `GET /api/projects`, `POST /api/projects`
- `GET /api/tasks`, `POST /api/tasks`, `POST /api/tasks/assign`
- `GET /api/timelogs`, `POST /api/timelogs/start|pause|resume|stop`, `GET /api/timelogs/timesheet`
- `GET /api/reports/users/:id`, `GET /api/reports/projects/:id`
- `GET /api/dashboard/admin`
- `GET /api/screenshots`, `POST /api/screenshots`, `DELETE /api/screenshots/:id`
- `GET /api/activities`, `POST /api/activities`, `GET /api/activities/summary`
- `GET /api/attendance`, `POST /api/attendance/clock-in`, `POST /api/attendance/clock-out`, `GET /api/attendance/active`
- `GET /api/shifts`, `POST /api/shifts`, `PATCH /api/shifts/:id`, `DELETE /api/shifts/:id`
- `GET /api/realtime/overview`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev     # starts Vite dev server on http://localhost:5173
```

The Vite dev server proxies API requests to the backend (`/api`). Sign in with the seeded demo accounts:

- Admin – `admin@webwork.dev` / `Password123!`
- Manager – `manager@webwork.dev` / `Password123!`
- Employees – `emma@webwork.dev`, `james@webwork.dev`, `sophia@webwork.dev` (all `Password123!`)

### Environment Variables

`backend/.env` supports override for:

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/webwork
JWT_SECRET=supersecretjwtkey
JWT_EXPIRES_IN=1d
```

The frontend relies on the proxy target defined in `frontend/vite.config.js`. Adjust if the backend runs on a different host/port.

### Desktop Tracker Setup

The `desktop/` folder ships with an Electron-based tracker that captures periodic screenshots while a timer is running.

```bash
cd desktop
cp .env.example .env   # adjust API_BASE_URL or interval if needed
npm install
npm start              # launches the tracker window

# On Windows, rebuild native hooks for the packaged Electron version
npm rebuild uiohook-napi --runtime=electron --target=28.2.1 --dist-url=https://electronjs.org/headers
npm rebuild active-win --runtime=electron --target=28.2.1 --dist-url=https://electronjs.org/headers

# Build Windows installer / portable exe
npm run dist
```

Usage tips:

- Sign in with a WebWork account (seeded or real). The tracker caches your session locally.
- Select one of your assigned tasks, then use the Start/Pause/Resume/Stop buttons. All timer actions sync with the backend.
- Screenshots are captured at the interval defined by `SCREENSHOT_INTERVAL_MINUTES` (default 5 minutes). Files are stored in `backend/uploads/screenshots` and are linked to the associated time log.
- Managers/Admins can review and delete captures from the Timesheets page in the web dashboard.
- Active window, URL, idle time, and CPU usage samples are uploaded every `ACTIVITY_INTERVAL_SECONDS` (default 15s) and power the productivity widgets on the supervisor dashboard.
- Keyboard and mouse activity (including optional keystroke logs) are collected with the desktop tracker. Configure retention and policies according to your organisation's compliance requirements.
- On Windows 10, the tracker ships with native input hooks (`uiohook-napi`). When packaging, rebuild the module and `active-win` against your Electron version (`npm rebuild uiohook-napi --runtime=electron --target=28.2.1 --dist-url=https://electronjs.org/headers` and same for `active-win`). macOS falls back to aggregate metrics without raw keystrokes.
- Clock-in/out controls sync with the attendance endpoints; timers auto-trigger a clock-in if the agent forgets.

### Supervisor Tools

- The dashboard (accessible to Admins/Managers) now surfaces real-time attendance, upcoming shifts, productivity scoring, and recent activity feeds.
- Attendance endpoints support clock-in/out tracking and can be extended with adherence rules (late/absent alerts).
- Shifts can be created via `POST /api/shifts` (Admin only) and reviewed through the dashboard widgets.

## Testing & Tooling

- `npm run dev` (backend) uses Nodemon for hot reload
- `npm run seed` recreates schema with demo data
- All Sequelize models are auto-synced at startup for quick bootstrap; migrate strategy can be added later
- TailwindCSS powers the UI; update `tailwind.config.js` for design tokens
- Electron tracker uses `screenshot-desktop` for captures. Package it with `electron-builder` or a similar tool when you're ready to distribute installers.
- Activity tracking leverages `active-win` and `systeminformation`. Extra telemetry (e.g., whitelisting apps/sites) can be layered on with policy logic in the tracker or backend services.

## Next Steps

1. Add automated tests (Jest/Supertest for backend, React Testing Library for frontend).
2. Introduce migrations with `sequelize-cli` for production safety.
3. Harden rate limiting, auditing, and activity logs for enterprise readiness.
4. Deploy via Docker (multi-stage build) with CI/CD and environment-specific configs.

Enjoy building with WebWork!
