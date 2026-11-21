import { canvasSurface } from "./canvas.js";

export const sensors = [
  { key: "co2", name: "Carbon dioxide", unit: "ppm", icon: "wind", color: "#437b5b", tint: "#e7f1e6" },
  {
    key: "temperature",
    name: "Temperature",
    unit: "°C",
    icon: "temperature",
    color: "#a96736",
    tint: "#f8ecdf",
  },
  { key: "humidity", name: "Humidity", unit: "%", icon: "drop", color: "#427b98", tint: "#e6f0f6" },
  { key: "illuminance", name: "Illuminance", unit: "lx", icon: "sun", color: "#977126", tint: "#f6efd8" },
];

export function drawSpark(canvas, samples, sensor) {
  const surface = canvasSurface(canvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  const values = samples.map((r) => r[sensor.key]).filter((v) => v !== null);
  if (!values.length) return;
  const min = values.reduce((a, b) => Math.min(a, b), Infinity),
    max = values.reduce((a, b) => Math.max(a, b), -Infinity);
  const start = samples[0].time,
    span = samples.at(-1).time - start;
  const x = (t) => (span ? 3 + ((t - start) / span) * (width - 6) : width - 3);
  const y = (v) => (max === min ? height / 2 : 4 + (1 - (v - min) / (max - min)) * (height - 9));
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, sensor.color + "20");
  gradient.addColorStop(1, sensor.color + "02");
  let run = [];
  function paint() {
    if (!run.length) return;
    ctx.beginPath();
    run.forEach((r, i) =>
      i ? ctx.lineTo(x(r.time), y(r[sensor.key])) : ctx.moveTo(x(r.time), y(r[sensor.key])),
    );
    ctx.strokeStyle = sensor.color;
    ctx.lineWidth = 1.7;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.lineTo(x(run.at(-1).time), height);
    ctx.lineTo(x(run[0].time), height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    run = [];
  }
  for (const r of samples) {
    if (r[sensor.key] === null) paint();
    else run.push(r);
  }
  paint();
  const last = samples.at(-1);
  if (last[sensor.key] !== null) {
    ctx.beginPath();
    ctx.arc(x(last.time), y(last[sensor.key]), 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = sensor.color;
    ctx.fill();
  }
}
