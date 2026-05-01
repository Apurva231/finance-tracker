import { useExpenses } from "./useExpenses";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";

export default function App() {
  const {
    expenses, meta, categories, filters,
    loading, error, submitting, submitError,
    updateFilter, addExpense, removeExpense, refresh,
  } = useExpenses();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">₹</span>
            <div>
              <span className="logo-name">Kharcha</span>
              <span className="logo-tagline">Personal Finance Tracker</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="layout">
          <aside className="sidebar">
            <ExpenseForm
              categories={categories}
              onSubmit={addExpense}
              submitting={submitting}
              submitError={submitError}
            />
          </aside>

          <section className="content">
            <div className="content-header">
              <h2>My Expenses</h2>
            </div>
            <ExpenseList
              expenses={expenses}
              meta={meta}
              categories={categories}
              filters={filters}
              loading={loading}
              error={error}
              onFilterChange={updateFilter}
              onDelete={removeExpense}
              onRetry={refresh}
            />
          </section>
        </div>
      </main>
    </div>
  );
}