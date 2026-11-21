import { readTimestamp } from "./time.js";

export const readingFields = [
  "timestamp",
  "room",
  "capacity",
  "occupancy",
  "co2",
  "temperature",
  "humidity",
  "illuminance",
  "predicted_class",
  "predicted_occupancy_ratio",
  "predicted_people_30min",
];
const numericFields = readingFields.filter(
  (field) => !["timestamp", "room", "predicted_class"].includes(field),
);

// Both SQLite's optional sample adapter and the React client use this contract.
// Optional measurements stay null, while a numeric zero remains a valid reading.
export function normalizeReadings(rows) {
  if (!Array.isArray(rows)) throw new Error("Expected a JSON array of readings.");
  const rooms = new Map();
  let zoned;
  rows.forEach((raw, i) => {
    function invalid(message) {
      throw new Error(`Reading ${i + 1}: ${message}`);
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) invalid("expected an object.");
    const stamp = typeof raw.timestamp === "string" && readTimestamp(raw.timestamp);
    if (!stamp) invalid("timestamp must be an ISO date and time.");
    if (zoned !== undefined && zoned !== stamp.zoned) invalid("use consistent timestamp zones.");
    zoned = stamp.zoned;
    if (!["number", "string"].includes(typeof raw.room) || !String(raw.room).trim())
      invalid("room is required.");
    const room = String(raw.room).trim();
    if (raw.predicted_class != null && typeof raw.predicted_class !== "string")
      invalid("predicted_class must be text or null.");
    const reading = {
      room,
      time: stamp.time,
      timestamp: raw.timestamp,
      predicted_class: raw.predicted_class?.trim() || null,
    };
    for (const key of numericFields) {
      const value = typeof raw[key] === "string" ? raw[key].trim() : raw[key];
      if (value == null || value === "") {
        reading[key] = null;
        continue;
      }
      if (!["string", "number"].includes(typeof value) || !Number.isFinite(Number(value)))
        invalid(key + " must be numeric.");
      reading[key] = Number(value);
    }
    if (!Number.isSafeInteger(reading.capacity) || reading.capacity <= 0)
      invalid("capacity must be a positive whole number.");
    if (!Number.isSafeInteger(reading.occupancy) || reading.occupancy < 0)
      invalid("occupancy must be a nonnegative whole number.");
    if (!rooms.has(room)) rooms.set(room, []);
    rooms.get(room).push(reading);
  });
  for (const [room, records] of rooms) {
    records.sort((a, b) => a.time - b.time);
    if (records.some((r, i) => i > 0 && r.time === records[i - 1].time))
      throw new Error("Duplicate timestamp in room " + room + ".");
  }
  const roomIds = [...rooms.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return { rooms, roomIds, count: rows.length, zoned: Boolean(zoned) };
}
