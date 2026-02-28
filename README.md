# Smart Grocery List Manager

Full-stack grocery planning app built with React + Express + Supabase.

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui + Axios
- Backend: Node.js + Express
- Database/Auth: Supabase (Postgres + Auth)

## Project Structure (Current Monorepo)

- `frontend/` - React app
- `backend/` - Express API
- `supabase/` - SQL schema

## Local Setup

1. Install dependencies
```bash
npm install
```
2. Copy `.env.example` to `.env` and fill values.
3. Run schema in Supabase SQL editor: `supabase/schema.sql`
4. Start app
```bash
npm run dev:full
```

## Required Environment Variables

Backend:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN`
- `PORT=4000`

Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `VITE_SESSION_TIMEOUT_MINUTES` (optional)

## Deployment (As Per Allocation Guidelines)

### A) Backend on Render

1. Create Render Web Service from this codebase (or backend split repo).
2. Use `render.yaml` defaults:
   - Build: `npm ci`
   - Start: `npm run server`
3. Add env vars:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_ORIGIN` = your Netlify domain origin
   - `PORT=4000`
4. Verify:
   - `https://<render-service>.onrender.com/health`

### B) Frontend on Netlify

This repo includes `netlify.toml`:
- Build command: `npm run build`
- Publish dir: `dist`
- SPA redirect configured.

In Netlify site settings, add frontend env vars:
- `VITE_API_URL=https://<render-service>.onrender.com`
- `VITE_SUPABASE_URL=https://<project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<anon-key>`
- `VITE_SESSION_TIMEOUT_MINUTES=60` (optional)

Deploy from `main` branch.

### C) Required 2-Repository Submission Format

Your college guideline asks separate FE and BE repos. Use this split:

1. Frontend repo:
   - Copy only `frontend/` contents to root of new FE repo.
   - Keep `netlify.toml`.
   - Deploy on Netlify.

2. Backend repo:
   - Copy `backend/`, `supabase/`, and required root files (`package.json`, `package-lock.json`, `render.yaml` or equivalent render config).
   - Deploy on Render.

3. Update FE env:
   - `VITE_API_URL` -> deployed Render backend URL.

## API Overview

- `GET /api/grocery-items`
- `POST /api/grocery-items`
- `PATCH /api/grocery-items/:id`
- `DELETE /api/grocery-items/:id`
- `POST /api/grocery-items/finalize`
- `GET /api/pantry`
- `POST /api/pantry`
- `PATCH /api/pantry/:id`
- `DELETE /api/pantry/:id`
- `GET /api/purchase-history`
- `GET /api/analytics/monthly-summary`
- `GET /api/products`

All `/api/*` routes require `Authorization: Bearer <supabase_access_token>`.
