import { useState } from "react";
import { useReadings } from "./hooks/useReadings.js";
import { Header } from "./components/Header.jsx";
import { Icon } from "./components/Icon.jsx";
import { RoomDashboard } from "./components/RoomDashboard.jsx";

export default function App() {
  const { dataset, loading, error, kind, load } = useReadings();
  const [view, setView] = useState("overview"),
    [requestedRoom, setRoom] = useState("");
  const room = dataset?.rooms.has(requestedRoom) ? requestedRoom : dataset?.roomIds[0];
  const hasData = Boolean(dataset?.count);
  return (
    <>
      <a className="skip" href="#main">
        Skip to dashboard
      </a>
      <Header
        view={view}
        onView={setView}
        onLoad={load}
        loading={loading}
        hasData={hasData}
        imported={kind === "csv"}
      />
      <main id="main" tabIndex={-1}>
        <div className="page-head">
          <div>
            <div className="eyebrow">
              <span className="status-dot" />
              {dataset?.source || "Readings API"}
            </div>
            <h1>{view === "log" ? "Data log" : "Room overview"}</h1>
            <p className="subtitle">
              Adaptive District Backbone <span>/</span> Digital twin
            </p>
          </div>
          {hasData && (
            <div className="room-control">
              <Icon name="room" />
              <select
                aria-label="Select room"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
              >
                {dataset.roomIds.map((id) => (
                  <option key={id} value={id}>
                    Room {id}
                  </option>
                ))}
              </select>
              <Icon name="chevron" />
            </div>
          )}
        </div>
        {loading && (
          <div className="notice" role="status">
            {dataset ? "Refreshing readings…" : "Loading readings…"}
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            <span>
              {error}
              {hasData ? " Showing the last loaded readings." : ""}
            </span>
            <button className="outline-btn" onClick={() => load()}>
              Retry API
            </button>
          </div>
        )}
        {!loading && !error && !hasData && (
          <div className="notice" role="status">
            The data source returned no readings.
          </div>
        )}
        {hasData && (
          <RoomDashboard
            key={JSON.stringify([kind, dataset.source, room])}
            records={dataset.rooms.get(room)}
            source={dataset.source}
            view={view}
            onView={setView}
          />
        )}
        <footer>
          <span>Adaptive District Backbone</span>
          {dataset && (
            <span>
              {dataset.count} readings · {dataset.zoned ? "UTC" : "Source clock"}
            </span>
          )}
        </footer>
      </main>
    </>
  );
}
