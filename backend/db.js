/**
 * Persistence: lowdb (JSON file).
 * Money stored as INTEGER paise (100 paise = ₹1) to avoid float precision issues.
 */
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../../data");
export const DB_PATH  = process.env.DB_PATH  || path.join(DATA_DIR, "expenses.json");

mkdirSync(DATA_DIR, { recursive: true });

const adapter = new JSONFile(DB_PATH);
export const db = new Low(adapter, { expenses: [] });

// Initialise on first import
await db.read();