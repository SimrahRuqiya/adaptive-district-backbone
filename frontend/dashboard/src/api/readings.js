import { normalizeReadings } from "../../shared/readings.js";

async function requestJson(url, signal) {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      typeof body?.error === "string" ? body.error : `Request failed (HTTP ${response.status}).`,
    );
  }
  try {
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("The endpoint returned an invalid JSON response.");
  }
}

export async function fetchReadings(signal) {
  const config = await requestJson("./dashboard-config.json", signal);
  if (typeof config?.readingsUrl !== "string" || !config.readingsUrl.trim()) {
    throw new Error("Set readingsUrl in dashboard-config.json.");
  }
  const data = await requestJson(config.readingsUrl.trim(), signal);
  const rows = Array.isArray(data) ? data : data?.readings;
  const source =
    typeof data?.source === "string" && data.source.trim() ? data.source.trim() : "Readings API";
  return { ...normalizeReadings(rows), source };
}
