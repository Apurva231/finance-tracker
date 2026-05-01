import { format, parseISO } from "date-fns";

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

const CATEGORY_ICONS = {
  "Food & Dining": "🍽️",
  "Transportation": "🚗",
  "Shopping": "🛍️",
  "Entertainment": "🎬",
  "Health & Medical": "🏥",
  "Housing & Utilities": "🏠",
  "Education": "📚",
  "Travel": "✈️",
  "Personal Care": "💆",
  "Other": "📌",
};

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat] || "💰";
}

export default function ExpenseList({
  expenses,
  meta,
  categories,
  filters,
  loading,
  error,
  onFilterChange,
  onDelete,
  onRetry,
}) {
  // Summary per category from current list
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  return (
    <div className="expense-list-section">
      {/* ── Filter bar ── */}
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="filter-cat">Category</label>
          <select
            id="filter-cat"
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-sort">Sort</label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => onFilterChange("sort", e.target.value)}
          >
            <option value="date_desc">Newest first</option>
            <option value="">Default</option>
          </select>
        </div>

        <div className="total-badge">
          <span className="total-label">Total</span>
          <span className="total-amount">{formatINR(meta.total)}</span>
          <span className="total-count">{meta.count} item{meta.count !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── Category summary ── */}
      {Object.keys(categoryTotals).length > 1 && (
        <div className="category-summary">
          {Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, total]) => (
              <div key={cat} className="cat-chip">
                <span>{getCategoryIcon(cat)}</span>
                <span className="cat-name">{cat}</span>
                <span className="cat-total">{formatINR(total)}</span>
              </div>
            ))}
        </div>
      )}

      {/* ── States ── */}
      {loading && (
        <div className="state-container">
          <div className="loading-dots">
            <span /><span /><span />
          </div>
          <p>Loading expenses…</p>
        </div>
      )}

      {!loading && error && (
        <div className="state-container error-state">
          <span className="state-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn-secondary" onClick={onRetry}>Retry</button>
        </div>
      )}

      {!loading && !error && expenses.length === 0 && (
        <div className="state-container empty-state">
          <span className="state-icon">📭</span>
          <p>{filters.category ? `No expenses in "${filters.category}"` : "No expenses yet. Add your first one!"}</p>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && expenses.length > 0 && (
        <div className="table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="expense-row">
                  <td className="date-cell">
                    {format(parseISO(e.date), "dd MMM yyyy")}
                  </td>
                  <td className="category-cell">
                    <span className="cat-badge">
                      <span>{getCategoryIcon(e.category)}</span>
                      {e.category}
                    </span>
                  </td>
                  <td className="desc-cell">{e.description}</td>
                  <td className="amount-cell">{formatINR(e.amount)}</td>
                  <td className="action-cell">
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(e.id)}
                      aria-label={`Delete ${e.description}`}
                      title="Delete"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}