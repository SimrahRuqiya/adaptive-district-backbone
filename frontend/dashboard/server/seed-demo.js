import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { csvRecords } from "../shared/csv.js";
import { normalizeReadings, readingFields } from "../shared/readings.js";

// The demo writes only its own database. It never takes a production DB path.
const local = new URL("./.local/", import.meta.url);
const csv = readFileSync(new URL("../sample/edge_predictions.csv", import.meta.url), "utf8");
const dataset = normalizeReadings(csvRecords(csv));
mkdirSync(local, { recursive: true });
const db = new DatabaseSync(fileURLToPath(new URL("demo.sqlite", local)));
try {
  db.exec("BEGIN");
  db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  db.exec("DELETE FROM readings");
  const insert = db.prepare(
    `INSERT INTO readings (${readingFields.join(", ")}) VALUES (${readingFields.map(() => "?").join(", ")})`,
  );
  for (const rows of dataset.rooms.values()) {
    for (const row of rows) insert.run(...readingFields.map((field) => row[field]));
  }
  db.exec("COMMIT");
  console.log(`Sample database ready with ${dataset.count} readings.`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
