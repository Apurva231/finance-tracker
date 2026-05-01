import { useState } from "react";
import { format } from "date-fns";

const DEFAULT_CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment",
  "Health & Medical", "Housing & Utilities", "Education", "Travel",
  "Personal Care", "Other",
];

const today = format(new Date(), "yyyy-MM-dd");

const EMPTY_FORM = {
  amount: "",
  category: "",
  description: "",
  date: today,
};

export default function ExpenseForm({ categories, onSubmit, submitting, submitError, onClearError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const allCategories = categories?.length ? categories : DEFAULT_CATEGORIES;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setValidationErrors((e) => ({ ...e, [key]: undefined }));
    if (onClearError) onClearError();
    setSuccess(false);
  }

  function validate() {
    const errors = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) errors.amount = "Enter a valid positive amount";
    if (String(form.amount).includes(".") && String(form.amount).split(".")[1]?.length > 2)
      errors.amount = "At most 2 decimal places allowed";
    if (!form.category) errors.category = "Select a category";
    if (!form.description.trim()) errors.description = "Description is required";
    if (form.description.trim().length > 500) errors.description = "Max 500 characters";
    if (!form.date) errors.date = "Date is required";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    const result = await onSubmit({
      amount: form.amount,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
    });
    if (result?.success) {
      setForm(EMPTY_FORM);
      setValidationErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="expense-form">
      <h2 className="form-title">Add Expense</h2>

      <div className="form-row two-col">
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            className={validationErrors.amount ? "input-error" : ""}
            disabled={submitting}
          />
          {validationErrors.amount && <span className="field-error">{validationErrors.amount}</span>}
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={form.date}
            max={today}
            onChange={(e) => set("date", e.target.value)}
            className={validationErrors.date ? "input-error" : ""}
            disabled={submitting}
          />
          {validationErrors.date && <span className="field-error">{validationErrors.date}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className={validationErrors.category ? "input-error" : ""}
          disabled={submitting}
        >
          <option value="">Select category…</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {validationErrors.category && <span className="field-error">{validationErrors.category}</span>}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          placeholder="What was this expense for?"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={validationErrors.description ? "input-error" : ""}
          disabled={submitting}
          maxLength={500}
        />
        {validationErrors.description && <span className="field-error">{validationErrors.description}</span>}
      </div>

      {submitError && (
        <div className="alert alert-error" role="alert">
          <span>⚠</span> {submitError}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <span>✓</span> Expense added successfully
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? (
          <span className="btn-loading"><span className="spinner" /> Saving…</span>
        ) : (
          "Add Expense"
        )}
      </button>
    </form>
  );
}