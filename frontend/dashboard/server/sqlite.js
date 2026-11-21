import { DatabaseSync } from "node:sqlite";
import { readingFields } from "../shared/readings.js";

// Replace this adapter if your team hosts its database behind this Node service.
// An existing REST backend can be used directly through dashboard-config.json.
export function readSqliteRows(filename) {
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    return db.prepare(`SELECT ${readingFields.join(", ")} FROM readings ORDER BY room, timestamp`).all();
  } finally {
    db.close();
  }
}

export function readingsRoute({ filename, source = "SQLite database" }) {
  return function serveReadings(req, res, next) {
    if (req.url?.split("?")[0] !== "/api/readings") return next();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    function send(status, body) {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    }
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return send(405, { error: "This endpoint accepts GET requests." });
    }
    if (!filename)
      return send(503, {
        error: "Configure the readings API, set TWIN_DB_PATH, or start the sample with npm run demo.",
      });
    try {
      return send(200, { source, readings: readSqliteRows(filename) });
    } catch (error) {
      console.error("Could not query the readings database:", error.message);
      return send(503, {
        error: "Cannot read the configured database. Check the server connection and readings schema.",
      });
    }
  };
}
