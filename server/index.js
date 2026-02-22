import "dotenv/config";
import cors from "cors";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());

async function requireUser(req, res, next) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Missing access token." });
    return;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid access token." });
    return;
  }

  req.user = data.user;
  next();
}

function toMonthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

function toIsoDate(d) {
  return d.toISOString();
}

async function monthlyTotal(userId, start, end) {
  const { data, error } = await supabaseAdmin
    .from("purchase_history")
    .select("total_amount")
    .eq("user_id", userId)
    .gte("purchase_date", toIsoDate(start))
    .lt("purchase_date", toIsoDate(end));

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
}

app.get("/health", (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api", requireUser);

app.get("/api/grocery-items", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("grocery_items")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json(data);
});

app.post("/api/grocery-items", async (req, res) => {
  const payload = {
    user_id: req.user.id,
    name: String(req.body.name ?? "").trim(),
    quantity: Number(req.body.quantity ?? 1),
    price: Number(req.body.price ?? 0),
    category: String(req.body.category ?? "other"),
  };

  if (!payload.name) {
    res.status(400).json({ error: "Item name is required." });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("grocery_items")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

app.patch("/api/grocery-items/:id", async (req, res) => {
  const update = {};
  if (req.body.name !== undefined) update.name = String(req.body.name).trim();
  if (req.body.quantity !== undefined) update.quantity = Number(req.body.quantity);
  if (req.body.price !== undefined) update.price = Number(req.body.price);
  if (req.body.category !== undefined) update.category = String(req.body.category);

  const { data, error } = await supabaseAdmin
    .from("grocery_items")
    .update(update)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json(data);
});

app.delete("/api/grocery-items/:id", async (req, res) => {
  const { error } = await supabaseAdmin
    .from("grocery_items")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(204).send();
});

app.post("/api/grocery-items/finalize", async (req, res) => {
  const { data: items, error: listError } = await supabaseAdmin
    .from("grocery_items")
    .select("*")
    .eq("user_id", req.user.id);

  if (listError) {
    res.status(400).json({ error: listError.message });
    return;
  }

  const totalAmount = (items ?? []).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const { data: historyRow, error: historyError } = await supabaseAdmin
    .from("purchase_history")
    .insert({
      user_id: req.user.id,
      total_amount: totalAmount,
      purchase_date: new Date().toISOString(),
      items_snapshot: items ?? [],
    })
    .select("*")
    .single();

  if (historyError) {
    res.status(400).json({ error: historyError.message });
    return;
  }

  const shouldClear = req.body.clear_list !== false;
  if (shouldClear) {
    const { error: clearError } = await supabaseAdmin
      .from("grocery_items")
      .delete()
      .eq("user_id", req.user.id);

    if (clearError) {
      res.status(400).json({ error: clearError.message });
      return;
    }
  }

  res.status(201).json(historyRow);
});

app.get("/api/pantry", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("pantry")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json(data);
});

app.post("/api/pantry", async (req, res) => {
  const itemName = String(req.body.item_name ?? "").trim();
  const quantity = Number(req.body.quantity ?? 0);
  const expiryDate = req.body.expiry_date ? String(req.body.expiry_date) : null;

  if (!itemName) {
    res.status(400).json({ error: "item_name is required." });
    return;
  }

  const { data: currentItems, error: queryError } = await supabaseAdmin
    .from("pantry")
    .select("*")
    .eq("user_id", req.user.id);

  if (queryError) {
    res.status(400).json({ error: queryError.message });
    return;
  }

  const duplicate = (currentItems ?? []).find(
    (row) => row.item_name.toLowerCase() === itemName.toLowerCase(),
  );

  if (duplicate) {
    const { data, error } = await supabaseAdmin
      .from("pantry")
      .update({
        quantity: Number(duplicate.quantity) + quantity,
        expiry_date: expiryDate ?? duplicate.expiry_date,
      })
      .eq("id", duplicate.id)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ ...data, merged_duplicate: true });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("pantry")
    .insert({
      user_id: req.user.id,
      item_name: itemName,
      quantity,
      expiry_date: expiryDate,
    })
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

app.patch("/api/pantry/:id", async (req, res) => {
  const update = {};
  if (req.body.item_name !== undefined) update.item_name = String(req.body.item_name).trim();
  if (req.body.quantity !== undefined) update.quantity = Number(req.body.quantity);
  if (req.body.expiry_date !== undefined) update.expiry_date = req.body.expiry_date || null;

  const { data, error } = await supabaseAdmin
    .from("pantry")
    .update(update)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("*")
    .single();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json(data);
});

app.delete("/api/pantry/:id", async (req, res) => {
  const { error } = await supabaseAdmin
    .from("pantry")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(204).send();
});

app.get("/api/purchase-history", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("purchase_history")
    .select("*")
    .eq("user_id", req.user.id)
    .order("purchase_date", { ascending: false })
    .limit(100);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json(data);
});

app.get("/api/analytics/monthly-summary", async (req, res) => {
  try {
    const now = new Date();
    const currentBounds = toMonthBounds(now);
    const previousMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const previousBounds = toMonthBounds(previousMonthDate);

    const [currentTotal, previousTotal] = await Promise.all([
      monthlyTotal(req.user.id, currentBounds.start, currentBounds.end),
      monthlyTotal(req.user.id, previousBounds.start, previousBounds.end),
    ]);

    const changeAmount = currentTotal - previousTotal;
    const savings = previousTotal > currentTotal ? previousTotal - currentTotal : 0;

    res.json({
      current_month_total: currentTotal,
      previous_month_total: previousTotal,
      change_amount: changeAmount,
      savings,
      trend: changeAmount <= 0 ? "down" : "up",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/products", async (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  let query = supabaseAdmin.from("products").select("*").limit(limit);

  if (req.query.category) {
    query = query.eq("category", String(req.query.category));
  }
  if (req.query.store) {
    query = query.eq("store", String(req.query.store));
  }
  if (req.query.search) {
    query = query.ilike("name", `%${String(req.query.search)}%`);
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json(data);
});

app.use((error, _, res, __) => {
  res.status(500).json({
    error: error?.message ?? "Unexpected server error.",
  });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
