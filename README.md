# Smart Grocery List Manager

Full-stack grocery planning app built with React + Express + Supabase.

## Tech stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express
- Auth/DB: Supabase Auth + Postgres

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file by copying `.env.example` to `.env`.

3. Fill `.env` with real Supabase credentials.

4. In Supabase SQL Editor, run `supabase/schema.sql`.

5. Start frontend + backend:

```bash
npm run dev:full
```

App URL: `http://localhost:8080`  
API URL: `http://localhost:4000`

## Environment variables

Required server variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN` (comma-separated allowed, for example `http://localhost:8080,http://localhost:5173`)
- `PORT` (default `4000`)

Required frontend variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (default `/api`)
- `VITE_SESSION_TIMEOUT_MINUTES` (default `60`)

## Push/Deploy notes

- This repository includes CI (`.github/workflows/ci.yml`) that runs lint, tests, and build on pushes/PRs.
- Frontend static hosting (GitHub Pages, Netlify, Vercel) works only for the React app.
- The Express API cannot run on GitHub Pages; deploy backend separately (for example Render/Railway/Fly/your VPS) and set `VITE_API_URL` to that backend URL.

## Production deployment (GitHub Pages + Render)

### 1) Deploy backend API (Render)

This repo includes `render.yaml` for the API service.

Required Render environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN` (set this to your GitHub Pages URL, for example `https://<username>.github.io`)
- `PORT` (keep `4000` unless you need different)

After deploy, verify:

- `https://<your-render-service>.onrender.com/health` returns JSON with `ok: true`.

### 2) Configure GitHub Pages frontend deploy

This repo includes `.github/workflows/deploy-frontend.yml`.

In GitHub repo settings, add these Actions secrets:

- `VITE_API_URL` = `https://<your-render-service>.onrender.com`
- `VITE_SUPABASE_URL` = your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
- `VITE_SESSION_TIMEOUT_MINUTES` = optional (example `60`)

Then:

1. Go to **Settings > Pages** and set source to **GitHub Actions**.
2. Push to `main` (or run the workflow manually).

The workflow sets:

- `VITE_BASE_PATH=/<repo-name>/` for GitHub Pages project path.

### 3) CORS and URL check

- Ensure backend `FRONTEND_ORIGIN` includes your deployed frontend URL.
- Ensure `VITE_API_URL` points to backend URL, **not** `http://localhost:4000`.

If frontend shows:

`Unable to connect to the service... (http://localhost:4000)`

it means frontend was built with a localhost API URL and must be rebuilt/redeployed with correct `VITE_API_URL`.

## API overview

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
