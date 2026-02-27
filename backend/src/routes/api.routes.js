import { Router } from "express";
import { requireUser } from "../middleware/requireUser.js";
import { supabaseAdmin } from "../config/supabase.js";
import { monthlyTotal, toMonthBounds } from "../utils/date.js";

export const apiRouter = Router();

apiRouter.use(requireUser);

apiRouter.get("/grocery-items", async (req, res) => {
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

apiRouter.post("/grocery-items", async (req, res) => {
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

apiRouter.patch("/grocery-items/:id", async (req, res) => {
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

apiRouter.delete("/grocery-items/:id", async (req, res) => {
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

apiRouter.post("/grocery-items/finalize", async (req, res) => {
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

apiRouter.get("/pantry", async (req, res) => {
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

apiRouter.post("/pantry", async (req, res) => {
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

apiRouter.patch("/pantry/:id", async (req, res) => {
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

apiRouter.delete("/pantry/:id", async (req, res) => {
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

apiRouter.get("/purchase-history", async (req, res) => {
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

apiRouter.get("/analytics/monthly-summary", async (req, res) => {
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

apiRouter.get("/products", async (req, res) => {
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
