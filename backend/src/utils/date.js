import { supabaseAdmin } from "../config/supabase.js";

export function toMonthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

export function toIsoDate(date) {
  return date.toISOString();
}

export async function monthlyTotal(userId, start, end) {
  const { data, error } = await supabaseAdmin
    .from("purchase_history")
    .select("total_amount")
    .eq("user_id", userId)
    .gte("purchase_date", toIsoDate(start))
    .lt("purchase_date", toIsoDate(end));

  if (error) throw error;

  return (data ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
}
