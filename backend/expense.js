import { db } from "./db.js";

export const CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment",
  "Health & Medical", "Housing & Utilities", "Education", "Travel",
  "Personal Care", "Other",
];

// Helpers
const now = () => new Date().toISOString();
const toPaise = (amount) => Math.round(parseFloat(amount) * 100);
const fromPaise = (paise) => (paise / 100).toFixed(2);

function deserialize(row) {
  return { ...row, amount: fromPaise(row.amount) };
}

/**
 * Idempotent upsert: if id already exists, return existing record unchanged.
 */
export async function upsertExpense({ id, amount, category, description, date }) {
  const existing = db.data.expenses.find((e) => e.id === id);
  if (existing) return deserialize(existing);

  const record = {
    id,
    amount: toPaise(amount),
    category,
    description,
    date,
    created_at: now(),
  };

  db.data.expenses.push(record);
  await db.write();
  return deserialize(record);
}

export function getExpenseById(id) {
  const row = db.data.expenses.find((e) => e.id === id);
  return row ? deserialize(row) : null;
}

export function listExpenses({ category, sort } = {}) {
  let results = [...db.data.expenses];

  if (category) {
    results = results.filter((e) => e.category === category);
  }

  if (sort === "date_desc") {
    results.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.created_at.localeCompare(a.created_at);
    });
  } else {
    results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return results.map(deserialize);
}

export async function deleteExpense(id) {
  const idx = db.data.expenses.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  db.data.expenses.splice(idx, 1);
  await db.write();
  return true;
}

export function getCategories() {
  const used = [...new Set(db.data.expenses.map((e) => e.category))];
  return used.sort();
}