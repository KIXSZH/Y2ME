import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const db = await open({
  filename: "songs.db",
  driver: sqlite3.Database
});

// ----------------------------------
// BASE TABLE (minimal, stable)
// ----------------------------------
await db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE
  )
`);

// ----------------------------------
// SAFE MIGRATIONS (IDEMPOTENT)
// ----------------------------------
await addColumnIfNotExists("selected", "INTEGER DEFAULT 0");
await addColumnIfNotExists("downloaded", "INTEGER DEFAULT 0");
await addColumnIfNotExists("filename", "TEXT");

// ----------------------------------
console.log("📦 SQLite database ready");

// ----------------------------------
// HELPERS
// ----------------------------------
async function addColumnIfNotExists(column, definition) {
  const columns = await db.all(`PRAGMA table_info(songs)`);
  const exists = columns.some(c => c.name === column);

  if (!exists) {
    await db.exec(`ALTER TABLE songs ADD COLUMN ${column} ${definition}`);
    console.log(`🧩 Added column: ${column}`);
  }
}
