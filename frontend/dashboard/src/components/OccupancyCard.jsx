import { clock, dayFmt, FORECAST_HORIZON_MS, number } from "../../shared/time.js";
import { Icon } from "./Icon.jsx";

function Forecast({ reading }) {
  const {
    predicted_people_30min: people,
    predicted_occupancy_ratio: ratio,
    predicted_class: label,
  } = reading;
  const target = reading.time + FORECAST_HORIZON_MS;
  const missing = people === null && ratio === null && !label;
  return (
    <div className="forecast">
      <div className="forecast-heading">
        <Icon name="trend" />
        <h3>30-minute forecast</h3>
        <time title={dayFmt.format(target) + " " + clock(target, true)}>{clock(target)}</time>
      </div>
      <div className="forecast-value">
        <strong>{number(people)}</strong>
        <span>expected people</span>
      </div>
      <div className="forecast-details">
        <span>
          {missing
            ? "No forecast in this reading"
            : ratio === null
              ? "Ratio unavailable"
              : number(ratio * 100) + "% of capacity"}
        </span>
        {label && <span className="class-tag">Class · {label}</span>}
      </div>
    </div>
  );
}
export function OccupancyCard({ reading }) {
  const { capacity, occupancy } = reading,
    ratio = occupancy / capacity,
    slots = Math.min(48, capacity);
  return (
    <section className="card occupancy">
      <div className="card-head">
        <h2>Occupancy</h2>
        <Icon name="users" />
      </div>
      <div className="occ-body">
        <div className="occ-number">
          <strong>{number(occupancy)}</strong>
          <span>/ {number(capacity)} people</span>
        </div>
        <div className="meter" aria-hidden="true">
          {Array.from({ length: slots }, (_, i) => (
            <b key={i} className={i < Math.round(slots * ratio) ? "used" : undefined} />
          ))}
        </div>
        <div className="util-line">
          <strong>{number(ratio * 100)}% occupied</strong>
          <span>
            {capacity >= occupancy
              ? number(capacity - occupancy) + " available"
              : number(occupancy - capacity) + " over capacity"}
          </span>
        </div>
      </div>
      <Forecast reading={reading} />
    </section>
  );
}
