import { supabaseAuth } from "../config/supabase.js";

export async function requireUser(req, res, next) {
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
