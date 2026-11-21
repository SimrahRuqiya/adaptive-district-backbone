export function readTimestamp(value) {
  const match =
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2})(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?$/i.exec(value);
  if (!match) return null;
  const [, date, hm, seconds = "00", fraction = "", zone] = match;
  const clock = date + "T" + hm + ":" + seconds + fraction.slice(0, 4);
  const nominal = Date.parse(clock + "Z");
  if (!Number.isFinite(nominal) || new Date(nominal).toISOString().slice(0, 19) !== clock.slice(0, 19))
    return null;
  const time = Date.parse(clock + (zone || "Z"));
  return Number.isFinite(time) ? { time, zoned: Boolean(zone) } : null;
}

export const dayFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const numberFmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
export const number = (n) => (n === null || n === undefined ? "—" : numberFmt.format(n));
export const clock = (t, seconds = false) => new Date(t).toISOString().slice(11, seconds ? 19 : 16);

export const FORECAST_HORIZON_MS = 30 * 60 * 1000;
