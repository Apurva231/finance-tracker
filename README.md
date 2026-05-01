# Kharcha — Personal Expense Tracker

A minimal full-stack expense tracker built with **Node.js/Express** (backend) and **React/Vite** (frontend).

## Key Design Decisions

### Money handling
Amounts are stored as **integer paise** (100 paise = ₹1) in the JSON file to avoid IEEE-754 float rounding bugs. They are converted to a 2-decimal string only at the API boundary.

### Idempotency / retry safety
The client generates a **UUID v4** per submission and stores it in `sessionStorage`. On POST, the backend checks if that ID already exists and returns the existing record instead of creating a duplicate. This means browser refresh, double-click, or network retry all result in exactly one expense — no duplicates.

### Persistence
**lowdb (JSON file)** was chosen because:
- Zero setup (no DB server to run)
- Human-readable data file for easy inspection/debugging
- Sufficient for a personal finance tool with hundreds of records
- Swap path: replacing `db.js` with a SQLite/Postgres adapter requires touching only one file

Trade-off: not suitable for multi-user concurrent writes (last write wins). Acceptable for a single-user personal tool.

### Frontend state
All filtering and sorting is done **server-side** (query params) so the total shown is always accurate relative to what the DB holds, not a stale client-side calculation.

## What I intentionally skipped
- Authentication (out of scope for personal tool demo)
- Pagination (not needed at small scale)
- Edit expense (CRUD completeness vs timebox — delete is included)
- Full E2E tests (integration tests cover the critical paths)

## Project Structure

```
finance_tracker/
├── backend/
│   ├── index.js          # Express app entry point
│   ├── db.js             # lowdb setup (JSON persistence)
│   ├── expense.js        # Data model + CRUD helpers
│   ├── expenses.js       # Route handlers (/expenses)
│   ├── expenses.test.js  # Integration tests
│   ├── jest.config.json
│   └── package.json
├── frontend/
│   ├── index.html        # Vite entry
│   ├── main.jsx          # React root
│   ├── App.jsx           # Root component
│   ├── ExpenseForm.jsx   # Add expense form
│   ├── ExpenseList.jsx   # List + filters + totals
│   ├── useExpenses.js    # State & API hook
│   ├── client.js         # Fetch wrapper with retry logic
│   ├── index.css         # Global styles
│   └── package.json
└── README.md
```

## Running Locally

### 1. Backend

```bash
cd backend
npm install
npm run dev
# API running at http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# UI running at http://localhost:5173
```

### 3. Tests

```bash
cd backend
npm test
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/expenses` | Create expense (idempotent via client-supplied UUID) |
| `GET` | `/expenses` | List expenses — supports `?category=X&sort=date_desc` |
| `GET` | `/expenses/categories` | List all known categories |
| `DELETE` | `/expenses/:id` | Delete expense |
| `GET` | `/health` | Health check |
