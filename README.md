# Harmony Factor

A polished, responsive full-stack wellness scoring platform with a modern landing page, combined auth flow, user analytics dashboard, and protected admin controls.

## Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Recharts
- **Backend**: Express + TypeScript + Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (email/password) + role-based authorization (USER/ADMIN)
- **Containers**: Docker Compose

## Final structure
- `frontend/`
  - `app/` routes/pages
  - `components/` UI shells
  - `lib/` API client/helpers
- `backend/`
  - `src/routes` auth/forms/admin APIs
  - `src/config` env feature flags
  - `prisma/` schema + seed data

## One-command local run
```bash
docker compose up --build
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000  
Health: http://localhost:8000/health

## Environment variables
### Frontend (`frontend/.env`)
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

### Backend (`backend/.env`)
- `PORT=8000`
- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/harmony`
- `JWT_SECRET=super-secret`
- `JWT_REFRESH_SECRET=super-refresh-secret`
- `FRONTEND_ORIGIN=http://localhost:3000`
- `APP_URL=http://localhost:3000`
- `ENABLE_EMAIL=false`
- `ENABLE_PDF_EXPORT=false`

## Demo/seed credentials
- Admin: `admin@harmony.local` / `Password123!`
- User: `user@harmony.local` / `Password123!`

Seed runs automatically in Docker startup.

### Reseed or wipe data
```bash
docker compose exec backend npm run seed
```
To wipe, remove volume and restart:
```bash
docker compose down -v
docker compose up --build
```

## API base URL flow (critical)
Browser calls use `NEXT_PUBLIC_API_URL` from `frontend/lib/api.ts`, so client-side requests go to `http://localhost:8000` (not Docker service DNS). Internal container networking is only used by backend↔postgres.

## Features delivered
- Landing page with polished hero + CTA to one combined auth page.
- Combined login/sign-up with email/password JWT auth.
- User dashboard with stats cards, backend connection status, trend chart, category breakdown chart, and form submission actions.
- Protected admin dashboard with user management, block/unblock, assignment, category weight tuning, submission deletion, search/filter/column visibility, CSV + Excel export, PDF export feature-flag stub.
- Backend feature flags and placeholders for email verification/reset delivery (`ENABLE_EMAIL=false` default; dev token links logged).

## Troubleshooting
- **CORS**: ensure `FRONTEND_ORIGIN=http://localhost:3000` in backend env.
- **Wrong API port**: ensure `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- **Prisma mismatch**: rebuild backend image with no cache:
  ```bash
  docker compose build --no-cache backend
  docker compose up --build
  ```
