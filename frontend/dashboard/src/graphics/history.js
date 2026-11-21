import { canvasSurface } from "./canvas.js";
import { clock, FORECAST_HORIZON_MS } from "../../shared/time.js";

// Only forecasts issued by the selected frame are visible. The horizontal
// coordinate of a forecast is its issue time plus the 30-minute horizon.
export function historySeries(readings, frame, hours) {
  const current = readings[frame].time;
  const start = hours ? Math.max(readings[0].time, current - hours * 3600000) : readings[0].time;
  const points = new Map();
  function get(t) {
    if (!points.has(t)) points.set(t, { time: t, actual: null, forecast: null });
    return points.get(t);
  }
  const observed = [],
    forecast = [];
  for (let i = 0; i <= frame; i++) {
    const r = readings[i],
      target = r.time + FORECAST_HORIZON_MS;
    if (r.time >= start) {
      get(r.time).actual = r.occupancy;
      observed.push([r.time, r.occupancy]);
    }
    if (target >= start) {
      forecast.push([target, r.predicted_people_30min]);
      if (r.predicted_people_30min !== null) get(target).forecast = r.predicted_people_30min;
    }
  }
  const ordered = Array.from(points.values()).sort((a, b) => a.time - b.time);
  return {
    start,
    end: Math.max(start + 60000, ordered.at(-1).time),
    current,
    observed,
    forecast,
    ordered,
  };
}

export function drawHistory(canvas, series, capacity) {
  const surface = canvasSurface(canvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  const { start, end, current, observed, forecast, ordered } = series;
  const left = 29,
    right = 21,
    top = 10,
    bottom = height - 25;
  let peak = capacity;
  ordered.forEach((p) => {
    peak = Math.max(peak, p.actual || 0, p.forecast || 0);
  });
  const step = Math.max(1, Math.ceil(peak / 4)),
    ceiling = step * 4;
  const x = (t) => left + ((t - start) / (end - start)) * (width - left - right);
  const y = (v) => bottom - (v / ceiling) * (bottom - top);
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillStyle = "#596a60";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const pos = y(i * step);
    ctx.beginPath();
    ctx.moveTo(left, pos);
    ctx.lineTo(width - right, pos);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e0e6dd";
    ctx.stroke();
    ctx.fillText(String(i * step), left - 8, pos);
  }
  if (current < end) {
    ctx.fillStyle = "#719a5c0c";
    ctx.fillRect(x(current), top, x(end) - x(current), bottom - top);
    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.moveTo(x(current), top);
    ctx.lineTo(x(current), bottom);
    ctx.strokeStyle = "#a9b9a4";
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const ticks = Math.max(2, Math.min(7, Math.floor(width / 93)));
  ctx.fillStyle = "#596a60";
  ctx.textBaseline = "top";
  for (let i = 0; i < ticks; i++) {
    const t = start + ((end - start) * i) / (ticks - 1);
    ctx.textAlign = i === 0 ? "left" : i === ticks - 1 ? "right" : "center";
    ctx.fillText(clock(t), x(t), bottom + 8);
  }
  function plot(values, color, dash, fill) {
    let run = [];
    function paint() {
      if (!run.length) return;
      ctx.beginPath();
      run.forEach(([t, v], i) => (i ? ctx.lineTo(x(t), y(v)) : ctx.moveTo(x(t), y(v))));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = "round";
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
      if (fill) {
        ctx.lineTo(x(run.at(-1)[0]), bottom);
        ctx.lineTo(x(run[0][0]), bottom);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, "#60946e28");
        g.addColorStop(1, "#60946e03");
        ctx.fillStyle = g;
        ctx.fill();
      }
      const [t, v] = run.at(-1);
      ctx.beginPath();
      ctx.arc(x(t), y(v), 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      run = [];
    }
    for (const pair of values) {
      if (pair[1] === null) paint();
      else run.push(pair);
    }
    paint();
  }
  plot(observed, "#386b51", [], true);
  plot(forecast, "#996a38", [5, 4], false);
  return { ordered, start, end, left, right, width };
}
