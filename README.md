# Harmony Project

Monorepo with a separated frontend and backend for the Harmony Factor platform.

## Stack
- Frontend: Next.js + TailwindCSS + Recharts
- Backend: Express + TypeScript + Prisma
- DB: PostgreSQL
- Auth: JWT access + refresh
- Local email simulation: Maildev via Docker

## Folder structure
- `frontend/`: user and admin UI
- `backend/`: API, auth, scoring, persistence
- `docs/`: architecture and future toggles

## Quick start
```bash
docker compose up --build
```

### Demo credentials
- Admin: `admin@harmony.local` / `Password123!`
- User: `user@harmony.local` / `Password123!`

## API overview
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/request-reset`
- `POST /auth/reset-password`
- `GET /forms/my-assigned`
- `POST /forms/:formId/submit`
- `GET /forms/my-submissions`
- `POST /forms` (admin)
- `GET /admin/users` (admin)
- `PATCH /admin/users/:userId/block` (admin)
- `POST /admin/assign-form` (admin)
- `GET /admin/export/csv` (admin)

## Notes
- Delete option in admin row actions is implemented as a commented button in UI for future enablement.
- Compliance-related features are scaffold-ready and can be activated later.

## Docker troubleshooting
- If backend image build fails at `RUN npx prisma generate`, rebuild with no cache after pulling latest changes:
  ```bash
  docker compose build --no-cache backend
  docker compose up --build
  ```
- This repo now sets a build-time `DATABASE_URL` in `backend/Dockerfile` so Prisma can generate its client during image build.
