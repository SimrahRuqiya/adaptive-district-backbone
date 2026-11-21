import { useRef } from "react";
import { Icon } from "./Icon.jsx";

export function Header({ view, onView, onLoad, loading, hasData, imported }) {
  const fileInput = useRef(null);
  const label = imported ? "Load API data" : "Refresh data";
  return (
    <header className="mast">
      <div className="mast-inner">
        <div className="brand">
          <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 2 33 10.5 18 19 3 10.5 18 2Z" fill="#ceee8e" />
            <path
              d="M3 15.3 18 23.8 33 15.3M3 21.4 18 30l15-8.6"
              stroke="#ceee8e"
              strokeWidth="3.1"
              strokeLinejoin="round"
            />
          </svg>
          <span>District Twin</span>
        </div>
        <nav aria-label="Dashboard views">
          {[
            ["overview", "Overview"],
            ["log", "Data log"],
          ].map(([key, text]) => (
            <button
              key={key}
              aria-current={view === key ? "page" : undefined}
              disabled={!hasData}
              onClick={() => onView(key)}
            >
              {text}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="import"
            disabled={loading}
            onClick={() => onLoad()}
            title={label}
            aria-label={label}
          >
            <Icon name="refresh" />
            <span>{label}</span>
          </button>
          <button
            className="import"
            onClick={() => fileInput.current.click()}
            aria-label="Import CSV"
            title="Import CSV"
          >
            <Icon name="upload" />
            <span>Import CSV</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            hidden
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onLoad(file);
            }}
          />
        </div>
      </div>
    </header>
  );
}
