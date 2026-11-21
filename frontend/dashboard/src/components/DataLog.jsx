import { useState } from "react";
import { clock, dayFmt } from "../../shared/time.js";
import { Icon } from "./Icon.jsx";

const columns = [
  ["capacity", "Capacity"],
  ["occupancy", "People"],
  ["co2", "CO₂ (ppm)"],
  ["temperature", "Temp (°C)"],
  ["humidity", "RH (%)"],
  ["illuminance", "Light (lx)"],
  ["predicted_people_30min", "Forecast people"],
  ["predicted_occupancy_ratio", "Forecast ratio"],
  ["predicted_class", "Model class"],
];
const PAGE_SIZE = 15;
export function DataLog({ records, source, onSelect }) {
  const [requestedPage, setPage] = useState(0);
  const page = Math.min(requestedPage, Math.ceil(records.length / PAGE_SIZE) - 1);
  const start = page * PAGE_SIZE,
    end = Math.min(start + PAGE_SIZE, records.length);
  const rows = records.slice(records.length - end, records.length - start).reverse();
  return (
    <section className="card log">
      <div className="chart-head">
        <div>
          <h2>Recorded readings</h2>
          <p className="subtext">Newest first. Select a timestamp to inspect its room view.</p>
        </div>
        <span className="file-label">
          <Icon name="file" />
          {source}
        </span>
      </div>
      <div className="table-scroll" tabIndex={0} aria-label="Scrollable readings table">
        <table>
          <thead>
            <tr>
              <th scope="col">Recorded at</th>
              {columns.map(([key, label]) => (
                <th key={key} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.time}>
                <td>
                  <button onClick={() => onSelect(row.time)} title={row.timestamp}>
                    {dayFmt.format(row.time)} · {clock(row.time, true)}
                  </button>
                </td>
                {columns.map(([key]) => (
                  <td key={key}>{row[key] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="log-footer">
        <span>
          {start + 1}–{end} of {records.length} readings
        </span>
        <div>
          <button className="outline-btn" disabled={!page} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button
            className="outline-btn"
            disabled={end === records.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
