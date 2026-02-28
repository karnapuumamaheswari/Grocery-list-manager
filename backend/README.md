# Grocery List Manager - Backend

## Project Overview
Node.js + Express API for grocery management, pantry inventory, budget analytics support, and purchase history persistence on Supabase.

## Tech Stack
- Node.js
- Express.js
- Supabase (Postgres + Auth)

## Structure
`src/config`, `src/middleware`, `src/routes`, `src/utils`

## API Endpoints
- `GET /health`
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

## Authentication
All `/api/*` routes require `Authorization: Bearer <supabase_access_token>`.

## Database Schema
Schema file: `../supabase/schema.sql`
- `grocery_items`
- `pantry`
- `purchase_history`
- `products`

## Installation
1. Install dependencies:
```bash
npm install
```
2. Set env vars:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN`
- `PORT=4000`
3. Run:
```bash
npm run dev:server
```

## Deployment (Render)
- Build command: `npm ci`
- Start command: `npm run server`
- Health endpoint: `/health`

