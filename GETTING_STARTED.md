# Quick Start Guide - Enhanced Grocery List Manager

## ðŸš€ Getting Started

### Prerequisites
- Node.js 18+ and npm/bun
- Supabase account
- Git (optional)

### Step 1: Install Dependencies
```bash
npm install
# or
bun install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:
```env
# Frontend config (already in .env.local)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:4000/api
VITE_SESSION_TIMEOUT_MINUTES=60
VITE_BASE_PATH=/
```

Create a backend `.env` file in the root directory:
```env
# Backend config
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
FRONTEND_ORIGIN=http://localhost:8080,http://localhost:3000
PORT=4000
```

### Step 3: Run the Application

**Development Mode (Both Frontend & Backend):**
```bash
npm run dev:full
# or
bun run dev:full
```

This runs:
- Frontend: `http://localhost:8080` (or `http://localhost:5173` with Vite)
- Backend: `http://localhost:4000`

**Or run separately:**

Terminal 1 - Frontend:
```bash
npm run dev
# or
bun run dev
```

Terminal 2 - Backend:
```bash
npm run dev:server
# or
bun run dev:server
```

### Step 4: Sign Up for an Account

1. Open http://localhost:5173 (or your frontend URL)
2. Click "Create Account"
3. Enter your email and password
4. Check your email for Supabase confirmation link
5. Click the confirmation link
6. Return to the app and log in

---

## ðŸ“ Key Features to Try

### 1. Dashboard
- After login, you'll see your dashboard with key metrics
- View total spending, pantry items, and alerts
- Check monthly spending comparison

### 2. Grocery List
- Click "Grocery" in navigation
- Add items with name, category, quantity, and price
- Edit or delete items with inline controls
- View live total cost
- Finalize list to save to purchase history

### 3. Pantry Management
- Click "Pantry" in navigation  
- Add items with expiry dates
- See visual alerts for:
  - ðŸ”´ Expiring soon (within 3 days)
  - ðŸŸ  Low stock (quantity â‰¤ 2)
- Items auto-sorted by expiry date

### 4. Purchase History
- Click "History" in navigation
- View all past purchases
- See spending trends and analytics

### 5. Budget Analytics
- Click "Budget" in navigation
- Compare spending with previous month
- View monthly spending chart
- Track spending trends

---

## ðŸŽ¯ Important Notes

### Session Management
- Default session timeout: 60 minutes
- Change with `VITE_SESSION_TIMEOUT_MINUTES`
- You'll be logged out if idle too long

### Database Setup
Ensure your Supabase project has the following tables:
```sql
-- grocery_items table
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  price NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- pantry table
CREATE TABLE pantry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- purchase_history table
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_amount NUMERIC,
  purchase_date TIMESTAMP,
  items_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- products table (static catalog)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC,
  brand TEXT,
  store TEXT
);
```

### Environment Validation
The backend validates all required environment variables on startup. You'll see an error if anything is missing.

---

## ðŸ› Troubleshooting

### Issue: "Missing/invalid Supabase environment variables"
- Check your `.env` file has all required variables
- Ensure values are correct from your Supabase dashboard
- No placeholder values like `YOUR_SUPABASE_URL`

### Issue: "CORS error" when calling API
- Check `FRONTEND_ORIGIN` in backend `.env`
- Should include your exact frontend URL
- For local dev: `http://localhost:8080,http://localhost:5173`

### Issue: "Email not confirmed" during login
- Check your email inbox for Supabase confirmation link
- Click the link to confirm your email
- Then try logging in again

### Issue: API returns 401 Unauthorized
- Your session may have expired
- Log out and log in again
- Check that your Supabase anon key is correct

### Issue: Authentication modal won't appear
- Check browser console for JavaScript errors
- Clear browser cache
- Ensure AuthModal component is rendered in App.tsx

---

## ðŸ“¦ Build for Production

```bash
npm run build
# or
bun run build
```

This creates an optimized build in the `dist/` directory.

To preview the production build:
```bash
npm run preview
# or
bun run preview
```

---

## ðŸ”§ Useful Commands

```bash
# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Build backend only
npm run build

# Start production server
npm run server
```

---

## ðŸ“š Project Structure

```
src/
â”œâ”€â”€ components/          # Reusable React components
â”‚   â”œâ”€â”€ Navigation.tsx   # Fixed navbar
â”‚   â”œâ”€â”€ Dashboard.tsx    # Home dashboard
â”‚   â”œâ”€â”€ AuthModal.tsx    # Auth form
â”‚   â”œâ”€â”€ GroceryTable.tsx # Grocery items table
â”‚   â”œâ”€â”€ PantryTable.tsx  # Pantry items table
â”‚   â””â”€â”€ ui/              # shadcn/ui components
â”œâ”€â”€ pages/
â”‚   â””â”€â”€ Index.tsx        # Main app page
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useGroceryStore.ts
â”‚   â””â”€â”€ use-toast.ts
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ api.ts           # API client
â”‚   â”œâ”€â”€ supabase.ts      # Supabase setup
â”‚   â””â”€â”€ utils.ts         # Utilities
â”œâ”€â”€ types/
â”‚   â””â”€â”€ app.ts           # TypeScript types
â””â”€â”€ App.tsx              # App router

backend/src/`r`nâ”œâ”€â”€ app.js               # Express app composition`r`nâ””â”€â”€ index.js             # Express backend startup

supabase/
â””â”€â”€ schema.sql           # Database schema
```

---

## ðŸŽ¨ Customization

### Change Session Timeout
Edit `.env`:
```env
VITE_SESSION_TIMEOUT_MINUTES=120  # 2 hours
```

### Change Colors
Edit `frontend/src/index.css` - Update CSS variables in `:root`

### Customize Navigation
Edit `frontend/src/components/Navigation.tsx`

### Add New Routes
1. Add to `src/App.tsx` routes
2. Create new page component
3. Update navigation links

---

## ðŸš€ Deployment

### Deploy to Production

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Deploy frontend** (to Netlify, Vercel, etc.)
   - Use `dist/` folder
   - Set environment variables

3. **Deploy backend** (to Heroku, Render, Railway, etc.)
   - Update `FRONTEND_ORIGIN` for CORS
   - Set all environment variables
   - Example for Heroku:
     ```bash
     git push heroku main
     ```

### Zero-Downtime Deployment
- Database migrations are handled by Supabase
- API changes are backward compatible
- Frontend builds independently

---

## ðŸ“ž Support

If you encounter issues:

1. **Check logs:**
   - Frontend: Browser console (F12)
   - Backend: Terminal output

2. **Common fixes:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Restart both frontend and backend
   - Check all environment variables

3. **Debug mode:**
   - Check browser DevTools Network tab
   - Use VS Code Debugger for Node.js
   - Add console.log statements

---

## âœ¨ What's New

### Enhanced Features
âœ… Fixed responsive navigation bar
âœ… Beautiful authentication modal
âœ… Professional dashboard with analytics
âœ… Improved grocery and pantry tables
âœ… Toast notifications for actions
âœ… Confirmation dialogs
âœ… Loading spinners
âœ… Mobile-optimized design
âœ… Dark theme by default
âœ… Secure authentication

### Backend
âœ… JWT token validation
âœ… User isolation (row-level security)
âœ… Environment variable protection
âœ… CORS with whitelisted origins
âœ… Error handling

---

## ðŸŽ‰ You're All Set!

Your Grocery List Manager is now ready to use. Start by signing up and exploring the features!

For more details, see `ENHANCEMENTS.md`.
