/**
 * Integration tests for the Expense Tracker API.
 * Uses an isolated temp JSON file so tests don't pollute production data.
 */

import request from "supertest";
import { randomUUID } from "crypto";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// Point DB to a temp directory BEFORE importing the app
const tmpDir = mkdtempSync(path.join(tmpdir(), "expense-test-"));
process.env.DB_PATH = path.join(tmpDir, "test.json");

const { default: app } = await import("./index.js");

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});


describe("POST /expenses", () => {
  it("creates a new expense and returns 200", async () => {
    const id = randomUUID();
    const res = await request(app).post("/expenses").send({
      id,
      amount: "150.50",
      category: "Food & Dining",
      description: "Lunch at Café",
      date: "2024-05-01",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.amount).toBe("150.50");
  });

  it("is idempotent — retrying with same id returns same record", async () => {
    const id = randomUUID();
    const payload = {
      id,
      amount: "200.00",
      category: "Shopping",
      description: "Books",
      date: "2024-05-02",
    };
    const res1 = await request(app).post("/expenses").send(payload);
    const res2 = await request(app).post("/expenses").send(payload);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.data.created_at).toBe(res2.body.data.created_at);
  });

  it("rejects negative amounts", async () => {
    const res = await request(app).post("/expenses").send({
      id: randomUUID(),
      amount: "-50",
      category: "Other",
      description: "Bad",
      date: "2024-05-01",
    });
    expect(res.status).toBe(422);
  });

  it("rejects missing fields", async () => {
    const res = await request(app).post("/expenses").send({ id: randomUUID() });
    expect(res.status).toBe(422);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe("GET /expenses", () => {
  const catA = "Transportation";
  const catB = "Entertainment";

  beforeAll(async () => {
    await request(app).post("/expenses").send({ id: randomUUID(), amount: "100", category: catA, description: "Bus", date: "2024-01-10" });
    await request(app).post("/expenses").send({ id: randomUUID(), amount: "200", category: catA, description: "Taxi", date: "2024-01-12" });
    await request(app).post("/expenses").send({ id: randomUUID(), amount: "300", category: catB, description: "Movie", date: "2024-01-11" });
  });

  it("returns all expenses with total", async () => {
    const res = await request(app).get("/expenses");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(parseFloat(res.body.meta.total)).toBeGreaterThanOrEqual(600);
  });

  it("filters by category", async () => {
    const res = await request(app).get(`/expenses?category=${catA}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((e) => expect(e.category).toBe(catA));
  });

  it("sorts by date_desc", async () => {
    const res = await request(app).get(`/expenses?category=${catA}&sort=date_desc`);
    const dates = res.body.data.map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});