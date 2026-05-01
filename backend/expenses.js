import { Router } from "express";
import { body, query, param, validationResult } from "express-validator";
import { upsertExpense, listExpenses, deleteExpense, getCategories, CATEGORIES } from "./expense.js";

const router = Router();

// ── Validation helpers ────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

// ── POST /expenses ─────────────────────────────────────────────────────────────
// Idempotency: client must supply a stable `id` (UUID v4).
// Retrying with the same id returns the original record without creating a duplicate.

router.post(
  "/",
  [
    body("id")
      .matches(UUID_REGEX)
      .withMessage("id must be a valid UUID v4"),
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("amount must be a positive number")
      .custom((v) => {
        // Reject more than 2 decimal places to prevent silent rounding surprises
        const parts = String(v).split(".");
        if (parts[1] && parts[1].length > 2) throw new Error("amount must have at most 2 decimal places");
        return true;
      }),
    body("category")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("category is required"),
    body("description")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("description is required")
      .isLength({ max: 500 })
      .withMessage("description must be 500 chars or fewer"),
    body("date")
      .matches(DATE_REGEX)
      .withMessage("date must be YYYY-MM-DD")
      .custom((v) => {
        const d = new Date(v);
        if (isNaN(d.getTime())) throw new Error("date is invalid");
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    try {
      const expense = await upsertExpense(req.body);
      // 200 for idempotent replay, 201 for new creation is hard to distinguish here;
      // we always return 200 with the canonical record.
      res.status(200).json({ data: expense });
    } catch (err) {
      console.error("POST /expenses error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── GET /expenses ──────────────────────────────────────────────────────────────

router.get(
  "/",
  [
    query("category").optional().isString().trim(),
    query("sort").optional().isIn(["date_desc"]).withMessage("sort must be 'date_desc'"),
  ],
  validate,
  (req, res) => {
    try {
      const { category, sort } = req.query;
      const expenses = listExpenses({ category: category || undefined, sort: sort || undefined });

      // Compute total in paise then convert — avoids float accumulation
      const totalPaise = expenses.reduce((sum, e) => sum + Math.round(parseFloat(e.amount) * 100), 0);
      const total = (totalPaise / 100).toFixed(2);

      res.json({ data: expenses, meta: { total, count: expenses.length } });
    } catch (err) {
      console.error("GET /expenses error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── GET /expenses/categories ───────────────────────────────────────────────────

router.get("/categories", (_req, res) => {
  try {
    const used = getCategories();
    // Return used categories + static defaults, deduplicated, sorted
    const all = Array.from(new Set([...used, ...CATEGORIES])).sort();
    res.json({ data: all });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /expenses/:id ───────────────────────────────────────────────────────

router.delete(
  "/:id",
  [param("id").matches(UUID_REGEX).withMessage("id must be a valid UUID")],
  validate,
  async (req, res) => {
    try {
      const deleted = await deleteExpense(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Expense not found" });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;