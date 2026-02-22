# Smart Grocery List Manager & Budget Tracking System

Full-stack grocery planning app built with React + Express + Supabase.

## Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Database/Auth: Supabase PostgreSQL + Supabase Auth

## Features

- User registration/login/logout with Supabase Auth
- User-isolated grocery list CRUD with quantity, category, and cost tracking
- Pantry management with low-stock and expiry warnings
- Duplicate pantry protection (duplicate item names are merged)
- Purchase finalization into `purchase_history`
- Monthly spending summary (current vs previous month + savings/increase)
- PDF export of current grocery list using `jsPDF`
- External store redirection for purchase planning (BigBasket, JioMart, Blinkit)
- Static product catalog browsing/search from `products` table

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill your Supabase values.

3. In Supabase SQL Editor, run:

```sql
-- file: supabase/schema.sql
```

4. Start backend and frontend:

```bash
npm run dev:full
```

Frontend runs on `http://localhost:5173`, API on `http://localhost:4000`.

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
