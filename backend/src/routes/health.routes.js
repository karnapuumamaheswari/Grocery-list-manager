import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});
