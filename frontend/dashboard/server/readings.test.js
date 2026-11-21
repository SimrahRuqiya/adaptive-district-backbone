import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { fetchReadings } from "../src/api/readings.js";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { readingsRoute } from "./sqlite.js";
import { csvRecords } from "../shared/csv.js";
import { normalizeReadings } from "../shared/readings.js";
import { historySeries } from "../src/graphics/history.js";

test("readings are queried anew and empty, null and zero remain distinct", async (t) => {
  const temp = await mkdtemp(join(tmpdir(), "district-twin-test-"));
  const filename = join(temp, "test.sqlite");
  const db = new DatabaseSync(filename);
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  db.exec(schema);
  const route = readingsRoute({ filename });
  t.after(async () => {
    db.close();
    await rm(temp, { recursive: true, force: true });
  });
  // Exercise the browser client, JSON boundary, route and SQLite together.
  // Keep this test independent of a free port or local network permissions.
  const url = "/api/readings";
  t.mock.method(globalThis, "fetch", async (path, options = {}) => {
    if (path === "./dashboard-config.json") return Response.json({ readingsUrl: url });
    let response;
    const headers = new Headers();
    const res = {
      setHeader(name, value) {
        headers.set(name, value);
      },
      end(body) {
        response = new Response(body, { status: this.statusCode, headers });
      },
    };
    route({ url: path, method: options.method ?? "GET" }, res, () => {
      response = new Response(null, { status: 404 });
    });
    return response;
  });
  const fetchDataset = () => fetchReadings(new AbortController().signal);
  assert.equal((await fetchDataset()).count, 0);
  const insert = db.prepare(
    "INSERT INTO readings(timestamp,room,capacity,occupancy,co2,predicted_people_30min) VALUES(?,?,?,?,?,?)",
  );
  insert.run("2026-03-01T01:05:00Z", "lab-B", 12, 0, null, 0);
  insert.run("2026-03-01T01:00:00Z", "lab-B", 12, 4, 500, null);
  insert.run("2026-03-01T01:30:00Z", "lab-A", 20, 3, 0, null);
  const dataset = await fetchDataset();
  assert.deepEqual(dataset.roomIds, ["lab-A", "lab-B"]);
  const records = dataset.rooms.get("lab-B");
  assert.equal(records[0].occupancy, 4);
  assert.equal(records[1].occupancy, 0);
  assert.equal(records[1].co2, null);
  assert.equal(dataset.rooms.get("lab-A")[0].co2, 0);
  const series = historySeries(records, 1, 0);
  assert.equal(series.ordered.at(-1).time, records[1].time + 1800000);
  assert.equal(series.ordered.at(-1).forecast, 0);
  assert.equal(historySeries(records, 0, 0).ordered.length, 1);
  db.exec("UPDATE readings SET occupancy=7 WHERE room='lab-A'");
  assert.equal((await fetchDataset()).rooms.get("lab-A")[0].occupancy, 7);
  assert.equal((await fetch(url, { method: "POST" })).status, 405);
});

test("sample CSV and API use the same data contract", async () => {
  const csv = await readFile(new URL("../sample/edge_predictions.csv", import.meta.url), "utf8");
  const rows = csvRecords(csv),
    data = normalizeReadings(rows);
  assert.equal(data.count, rows.length);
  for (const row of rows) {
    const record = data.rooms.get(row.room).find((r) => r.timestamp === row.timestamp);
    for (const key of [
      "capacity",
      "occupancy",
      "co2",
      "temperature",
      "humidity",
      "illuminance",
      "predicted_occupancy_ratio",
      "predicted_people_30min",
    ]) {
      assert.equal(record[key], row[key] === "" ? null : Number(row[key]));
    }
  }
  assert.throws(() => normalizeReadings([{ ...rows[0], occupancy: false }]), /numeric/);
  assert.throws(() => normalizeReadings([rows[0], rows[0]]), /Duplicate timestamp/);
});

test("changing the runtime URL switches backends and API errors reach the caller", async (t) => {
  const paths = [];
  t.mock.method(globalThis, "fetch", async (path) => {
    paths.push(path);
    if (path === "./dashboard-config.json") return Response.json({ readingsUrl: "/building/telemetry" });
    return Response.json({ error: "Telemetry database is offline." }, { status: 503 });
  });
  await assert.rejects(fetchReadings(new AbortController().signal), /Telemetry database is offline/);
  assert.deepEqual(paths, ["./dashboard-config.json", "/building/telemetry"]);
});
