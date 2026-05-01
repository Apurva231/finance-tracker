import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { mkdirSync } from "fs";
import expensesRouter from "./expenses.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure data directory exists
mkdirSync(path.join(__dirname, "../../data"), { recursive: true });

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────

// Allow all origins for the assignment deployment
app.use(cors());

app.use(express.json());

// Request logger (simple, not a dependency)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/expenses", expensesRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});

export default app;