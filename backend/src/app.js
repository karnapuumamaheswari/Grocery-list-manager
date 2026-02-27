import "dotenv/config";
import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/api.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import "./config/supabase.js";

export const app = express();

const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, frontendOrigins.includes(origin));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use("/health", healthRouter);
app.use("/api", apiRouter);

app.use((error, _, res, __) => {
  res.status(500).json({
    error: error?.message ?? "Unexpected server error.",
  });
});
