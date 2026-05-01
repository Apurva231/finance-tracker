import { useState, useEffect, useCallback, useRef } from "react";
import { fetchExpenses, fetchCategories, createExpense, deleteExpense, ApiError } from "./client";
import { v4 as uuidv4 } from "uuid";

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState({ total: "0.00", count: 0 });
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: "", sort: "date_desc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  const loadExpenses = useCallback(async (currentFilters) => {
    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const res = await fetchExpenses(
        { category: currentFilters.category || undefined, sort: currentFilters.sort || undefined },
        abortRef.current.signal
      );
      setExpenses(res.data);
      setMeta(res.meta);
    } catch (err) {
      if (err.name === "AbortError") return; // stale request, ignore
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {}); // non-critical
  }, []);

  // Reload whenever filters change
  useEffect(() => {
    loadExpenses(filters);
  }, [filters, loadExpenses]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  // ── Form submission ──────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Persist pending ID in sessionStorage so page refreshes don't create duplicates
  const PENDING_KEY = "expense_pending_id";

  async function addExpense(formData) {
    setSubmitting(true);
    setSubmitError(null);

    // Re-use any stored pending ID (handles refresh-after-submit scenario)
    let id = sessionStorage.getItem(PENDING_KEY) || uuidv4();
    sessionStorage.setItem(PENDING_KEY, id);

    try {
      await createExpense({ id, ...formData });
      sessionStorage.removeItem(PENDING_KEY); // success — clear pending id
      await loadExpenses(filters);
      // Also refresh categories in case a new one was added
      fetchCategories().then((res) => setCategories(res.data)).catch(() => {});
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        // Validation error — clear the pending ID so next attempt gets fresh UUID
        sessionStorage.removeItem(PENDING_KEY);
        setSubmitError(err.message);
      } else {
        setSubmitError(err.message || "Failed to save expense");
      }
      return { success: false, error: err };
    } finally {
      setSubmitting(false);
    }
  }

  async function removeExpense(id) {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      // Recompute total locally for instant feedback, then sync
      loadExpenses(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  return {
    expenses,
    meta,
    categories,
    filters,
    loading,
    error,
    submitting,
    submitError,
    updateFilter,
    addExpense,
    removeExpense,
    refresh: () => loadExpenses(filters),
  };
}