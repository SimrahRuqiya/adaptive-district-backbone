import { sensors, drawSpark } from "../graphics/sensors.js";
import { number } from "../../shared/time.js";
import { DrawingCanvas } from "./DrawingCanvas.jsx";
import { Icon } from "./Icon.jsx";

function SensorCard({ sensor, reading, samples }) {
  return (
    <article className="card sensor" style={{ "--tint": sensor.tint, "--tone": sensor.color }}>
      <h3 className="sensor-title">
        <span className="sensor-icon">
          <Icon name={sensor.icon} />
        </span>
        {sensor.name}
      </h3>
      <div className="sensor-data">
        <strong className="sensor-number">{number(reading[sensor.key])}</strong>
        <span className="sensor-unit">{sensor.unit}</span>
      </div>
      <DrawingCanvas className="spark" draw={(canvas) => drawSpark(canvas, samples, sensor)} />
    </article>
  );
}
export function SensorPanel({ records, frame }) {
  const reading = records[frame];
  let first = frame;
  while (first > 0 && records[first - 1].time >= reading.time - 3600000) first--;
  const samples = records.slice(first, frame + 1);
  return (
    <section aria-label="Environment">
      <div className="section-head">
        <h2>Environment</h2>
        <span className="secondary">Trends · past hour</span>
      </div>
      <div className="sensors">
        {sensors.map((sensor) => (
          <SensorCard key={sensor.key} sensor={sensor} samples={samples} reading={reading} />
        ))}
      </div>
    </section>
  );
}
