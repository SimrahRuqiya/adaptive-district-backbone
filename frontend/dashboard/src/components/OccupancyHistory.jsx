import { useMemo, useRef, useState, useCallback } from "react";
import { clock, dayFmt, number } from "../../shared/time.js";
import { historySeries, drawHistory } from "../graphics/history.js";
import { DrawingCanvas } from "./DrawingCanvas.jsx";

function nearest(points, time) {
  let lo = 0,
    hi = points.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (points[mid].time < time) lo = mid + 1;
    else hi = mid;
  }
  return lo && time - points[lo - 1].time < points[lo].time - time ? points[lo - 1] : points[lo];
}
export function OccupancyHistory({ records, frame }) {
  const [hours, setHours] = useState(6),
    [hover, setHover] = useState(null);
  const geometry = useRef(null);
  const series = useMemo(() => historySeries(records, frame, hours), [records, frame, hours]);
  const reading = records[frame];
  const draw = useCallback(
    (canvas) => {
      geometry.current = drawHistory(canvas, series, reading.capacity);
    },
    [series, reading.capacity],
  );
  function inspect(event) {
    if (!geometry.current) return;
    const { left, right, width, start, end, ordered } = geometry.current;
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const time = start + ((x - left) / (width - left - right)) * (end - start);
    setHover({ series, point: nearest(ordered, time), x: Math.max(0, Math.min(width - 185, x + 8)) });
  }
  const point = hover?.series === series ? hover.point : null;
  return (
    <section className="card history">
      <div className="chart-head">
        <div>
          <h2>Occupancy history</h2>
          <p className="subtext">Forecasts appear at their 30-minute target time.</p>
        </div>
        <div className="segmented" role="group" aria-label="History window">
          {[1, 6, 0].map((h) => (
            <button key={h} onClick={() => setHours(h)} aria-pressed={hours === h}>
              {h === 0 ? "All" : h + " h"}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-keys">
        <span>
          <b className="line-key" />
          Recorded
        </span>
        <span>
          <b className="line-key prediction" />
          Forecast
        </span>
        <span className="axis-unit">People</span>
      </div>
      <div id="chartArea" onPointerMove={inspect} onPointerLeave={() => setHover(null)}>
        <DrawingCanvas
          id="chart"
          draw={draw}
          label={`Room ${reading.room} occupancy through ${dayFmt.format(reading.time)} ${clock(reading.time)}. Exact readings are available in Data log.`}
        />
        {point && (
          <div id="chartTip" style={{ top: 8, left: hover.x }}>
            {dayFmt.format(point.time)} · {clock(point.time)}
            <br />
            Recorded {number(point.actual)}
            <br />
            Forecast {number(point.forecast)}
          </div>
        )}
      </div>
    </section>
  );
}
