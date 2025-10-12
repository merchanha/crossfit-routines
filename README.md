# CrossFit Routines - Monorepo

This repository contains a full-stack CrossFit routines management application:

- Backend: NestJS + TypeORM + PostgreSQL
- Frontend: React (Vite) + TypeScript + TailwindCSS

The app supports JWT authentication, routines management, workout scheduling, notes, a simplified workout session timer, workout history/progress view, and **AI-powered features** (recommendations and routine generation).

## Prerequisites

- Node.js 18+ and npm 9+
- Docker (for local Postgres)
- Git

## Services & Defaults

- Backend API: `http://localhost:3001/api`
- Frontend App: `http://localhost:5173`
- Postgres: `localhost:5432`

---

## 1) Backend (NestJS)

Path: `./backend`

### Setup

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in `./backend` (if you don't already have one):

```env
# App
PORT=3001
GLOBAL_PREFIX=api
NODE_ENV=development

# JWT
JWT_SECRET=super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Database (Postgres)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=crossfit_db

# Image Storage
# Options: 'local' or 'cloudinary'
IMAGE_STORAGE_PROVIDER=local

# Cloudinary Configuration (only needed if IMAGE_STORAGE_PROVIDER=cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Features Configuration (optional - see backend/AI_ENV_VARIABLES.md for details)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-pro
AI_RATE_LIMIT_REQUESTS_PER_DAY=3
AI_ENABLE_CACHING=true
```

> **Note**: AI features are optional. See `backend/AI_ENV_VARIABLES.md` for detailed configuration instructions and API key setup.

If you want different credentials, update both the `.env` and the docker-compose file or your running Postgres accordingly.

### Start Postgres (Docker)

```bash
cd backend
docker-compose up -d
```

This starts a local Postgres and (optionally) pgAdmin:
- Postgres: `localhost:5432` (user: `postgres`, password: `postgres`)
- pgAdmin: `http://localhost:5050` (if enabled; see docker-compose.yml)

### Database Migrations

Run migrations (after DB is up):

```bash
npm run db:migration:run
```

Useful scripts:

```bash
# Generate new migration (when you change entities)
npm run db:migration:generate -- src/database/migrations/SomeMigrationName

# Run migrations
npm run db:migration:run

# Revert last migration
npm run db:migration:revert
```

### Run Backend (dev)

```bash
npm run start:dev
```

API available at `http://localhost:3001/api`

### Swagger (if enabled)

Visit `http://localhost:3001/api/docs` (if Swagger is configured in your build).

---

## 2) Frontend (React + Vite)

Path: `./frontend`

### Setup

```bash
cd frontend
npm install
```

### Environment Variables

Create `./frontend/.env` (or `.env.local`) to point to your backend API:

```env
VITE_API_URL=http://localhost:3001/api
```

### Run Frontend (dev)

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## 3) App Flows (Highlights)

### Authentication
- Register and Login return a JWT; the frontend stores it in `localStorage`.
- Protected routes redirect to Login when unauthenticated.

### Routines
- Create/Edit routines (now with `estimatedDuration` at the routine level; per-exercise `duration` removed).
- Exercises support `sets`, `reps`, `notes`.

### Scheduling Workouts
- Schedule routines by date.
- Calendar view shows scheduled workouts per day.

### Workout Session (Simplified)
- Time-based session: play/pause/reset timer.
- On completion, the session stores `finalDuration` for the scheduled workout.

### Workout History
- New `/history` page lists completed workouts with:
  - Routine name
  - Estimated duration (mins)
  - Final duration (actual time)
  - Delta (faster/slower/on-target)
  - Date
  - Link to routine details
- Sorting and search supported.

---

## 4) Common Commands

### Backend
```bash
# from ./backend
npm run start:dev               # Start NestJS in watch mode
npm run db:migration:run        # Apply DB migrations
npm run db:migration:revert     # Revert last migration
npm run db:migration:generate -- src/database/migrations/Name
```

### Frontend
```bash
# from ./frontend
npm run dev                     # Start Vite dev server
npm run build                   # Production build
npm run preview                 # Preview production build
```

---

## 5) Troubleshooting

- 401 Unauthorized loops after logout:
  - Clear `localStorage` and ensure `VITE_API_URL` points to the correct backend URL.
  - Frontend guards already check auth before fetching; make sure token exists.

- New user shows old profile data:
  - Fixed by using `@UserId()` in `/users/profile`. If you still see stale data, clear `localStorage` and refresh.

- Dates/timezones:
  - All scheduled date strings are normalized to `YYYY-MM-DD` on the frontend.
  - Backend parses dates with local timezone semantics to prevent shifts.

- Migrations fail with existing columns:
  - The migration now checks for column existence. If you still have issues, verify DB schema manually or revert conflicting migrations.

- Ports already in use:
  - Change `PORT` in backend `.env`, or change Vite port with `--port` in `package.json`.

---

## 6) Project Structure

```
crossfit-routines/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── routines/
│   │   ├── scheduled-workouts/
│   │   ├── notes/
│   │   └── database/
│   │       ├── data-source.ts
│   │       └── migrations/
│   ├── docker-compose.yml
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── views/
│   ├── package.json
│   └── ...
└── README.md (this file)
```

---

## 7) Useful URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`
- Calendar: `/calendar`
- Routines: `/routines`
- Workout Session: `/workout/:workoutId`
- Workout History: `/history`

---

## 8) Deployment

### Quick Setup
```bash
# Run the setup script
./scripts/setup-deployment.sh

# Test deployment locally
BACKEND_URL=http://localhost:3001 ./scripts/test-deployment.sh
```

### Production Deployment
For detailed deployment instructions using free services (Render + Vercel), see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Services Used:**
- **Backend**: Render (free tier)
- **Frontend**: Vercel (free tier)
- **Database**: PostgreSQL on Render (free tier)
- **CI/CD**: GitHub Actions

---

## 9) Notes

- Routine schema updates:
  - Removed per-exercise `duration`
  - Added `estimatedDuration` at routine-level (minutes)
  - Scheduled workout now saves `finalDuration` (seconds) upon completion

If you run into issues, please share console logs (frontend) and backend logs; both have helpful contextual logging to speed up debugging.
