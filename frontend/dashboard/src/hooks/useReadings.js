import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReadings } from "../api/readings.js";
import { csvRecords } from "../../shared/csv.js";
import { normalizeReadings } from "../../shared/readings.js";

export function useReadings() {
  const [result, setResult] = useState({ dataset: null, loading: true, error: "", kind: "api" });
  const active = useRef(null);
  const load = useCallback(async (file = null) => {
    active.current?.abort();
    const request = new AbortController();
    active.current = request;
    setResult((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const dataset = file
        ? { ...normalizeReadings(csvRecords(await file.text())), source: file.name }
        : await fetchReadings(request.signal);
      if (!request.signal.aborted)
        setResult({ dataset, loading: false, error: "", kind: file ? "csv" : "api" });
    } catch (error) {
      if (!request.signal.aborted) {
        const prefix = file ? "CSV import failed. " : "Could not load the readings API. ";
        setResult((previous) => ({ ...previous, loading: false, error: prefix + error.message }));
      }
    }
  }, []);
  useEffect(() => {
    load();
    return () => active.current?.abort();
  }, [load]);
  return { ...result, load };
}
