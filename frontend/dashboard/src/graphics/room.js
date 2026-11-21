import { canvasSurface } from "./canvas.js";

// An illustrative axonometric classroom. Only capacity and occupied-seat
// count come from the recording. Furniture and seat locations are schematic.
export function drawRoom(canvas, record) {
  const surface = canvasSurface(canvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  const W = 12,
    D = 8.15,
    H = 2.15,
    xSlope = 0.97,
    ySlope = 0.295;
  const top = 13,
    bottom = 13;
  const size = Math.min(
    (width - 32) / (xSlope * (W + D) + 0.6),
    (height - top - bottom) / (ySlope * (W + D) + H + 0.75),
  );
  const originX = width / 2 - ((W - D) * xSlope * size) / 2;
  const originY = (height - size * ((W + D) * ySlope - H + 0.33)) / 2;
  const pt = ([x, y, z]) => [originX + (x - y) * xSlope * size, originY + ((x + y) * ySlope - z) * size];
  function polygon(vertices, fill, stroke, lineWidth = 0.65) {
    ctx.beginPath();
    vertices.map(pt).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }
  function line(a, b, color, weight = 0.7) {
    ctx.beginPath();
    ctx.moveTo(...pt(a));
    ctx.lineTo(...pt(b));
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.stroke();
  }
  function box(x, y, z, w, d, h, colors, edge) {
    const X = x + w,
      Y = y + d,
      Z = z + h;
    polygon(
      [
        [X, y, z],
        [X, Y, z],
        [X, Y, Z],
        [X, y, Z],
      ],
      colors[1],
      edge,
    );
    polygon(
      [
        [x, Y, z],
        [X, Y, z],
        [X, Y, Z],
        [x, Y, Z],
      ],
      colors[2],
      edge,
    );
    polygon(
      [
        [x, y, Z],
        [X, y, Z],
        [X, Y, Z],
        [x, Y, Z],
      ],
      colors[0],
      edge,
    );
  }
  function floorPatch(x, y, w, d, fill, z = 0.006) {
    polygon(
      [
        [x, y, z],
        [x + w, y, z],
        [x + w, y + d, z],
        [x, y + d, z],
      ],
      fill,
    );
  }
  ctx.save();
  ctx.shadowColor = "#3d504b52";
  ctx.shadowBlur = size * 0.55;
  ctx.shadowOffsetY = size * 0.23;
  floorPatch(-0.06, -0.06, W + 0.12, D + 0.12, "#869989", -0.22);
  ctx.restore();
  box(-0.075, -0.075, -0.22, W + 0.15, D + 0.15, 0.22, ["#e5e1d6", "#b4baaa", "#c9ccbc"], "#a1ac9d");
  floorPatch(0, 0, W, D, "#eae6da");
  for (let x = 0; x < W; x += 0.85) line([x, 0, 0.002], [x, D, 0.002], "#d6d2c4", 0.55);
  for (let y = 0; y < D; y += 0.85) line([0, y, 0.002], [W, y, 0.002], "#d4d0c2", 0.55);
  // Perimeter walls, limestone caps, and skirting.
  box(-0.14, -0.12, 0, 0.14, D + 0.27, H, ["#f6f6ef", "#e2e6da", "#c9d1c4"], "#adb9a8");
  box(-0.14, -0.14, 0, W + 0.29, 0.14, H, ["#fffff8", "#c4cfc0", "#f4f2e9"], "#b8c2b2");
  box(0, 0, 0, 0.09, D, 0.13, ["#dce0d1", "#aab6a6", "#bfc8b7"]);
  box(0, 0, 0, W, 0.09, 0.13, ["#e0e3d5", "#aab6a6", "#c4cbbc"]);
  // Three mullioned window bays in the left wall.
  for (let bay = 0; bay < 3; bay++) {
    const y = 0.38 + bay * 2.53,
      length = 2.21,
      sill = 0.78,
      hi = 1.91;
    polygon(
      [
        [0.015, y, sill],
        [0.015, y + length, sill],
        [0.015, y + length, hi],
        [0.015, y, hi],
      ],
      "#89a397",
      "#6e887e",
    );
    polygon(
      [
        [0.025, y + 0.055, sill + 0.06],
        [0.025, y + length - 0.055, sill + 0.06],
        [0.025, y + length - 0.055, hi - 0.06],
        [0.025, y + 0.055, hi - 0.06],
      ],
      "#c2d9d2",
    );
    polygon(
      [
        [0.03, y + 0.18, sill + 0.1],
        [0.03, y + 0.61, sill + 0.1],
        [0.03, y + 1.45, hi - 0.1],
        [0.03, y + 0.98, hi - 0.1],
      ],
      "#d4e6de",
    );
    box(0.025, y + length / 2, sill, 0.04, 0.044, hi - sill, ["#eef3e8", "#779389", "#8ca79b"]);
    line([0.056, y, sill + 0.43], [0.056, y + length, sill + 0.43], "#95aea3", 0.8);
    box(0, y - 0.055, sill - 0.075, 0.18, length + 0.11, 0.08, ["#f6f6ed", "#afbdaf", "#c4cec1"]);
  }
  // Board, tray and a small teaching desk at the front.
  box(2.25, 0.015, 0.86, 5.95, 0.07, 1.04, ["#cbd4c6", "#a8baaa", "#c2cdbf"], "#869787");
  polygon(
    [
      [2.32, 0.093, 0.92],
      [8.12, 0.093, 0.92],
      [8.12, 0.093, 1.84],
      [2.32, 0.093, 1.84],
    ],
    "#fafbf4",
  );
  box(2.34, 0.09, 0.84, 5.75, 0.14, 0.035, ["#a6b5a5", "#909f92", "#a1ae9e"]);
  box(6.57, 0.13, 0.875, 0.29, 0.045, 0.045, ["#678a70", "#496b54", "#587d60"]);
  // Draw furniture in depth order so nearer seats occlude farther desks.
  const objects = [];
  function add(depth, draw) {
    objects.push({ depth, draw });
  }
  const seats = Math.min(record.capacity, 96);
  const occupied = Math.min(record.occupancy, seats);
  const desks = Math.ceil(seats / 2);
  const columns = Math.max(1, Math.ceil(Math.sqrt(desks * 1.0)));
  const rows = Math.ceil(desks / columns);
  const pitchX = 9.95 / columns,
    pitchY = 6.47 / rows;
  const factor = Math.min(1, pitchX / 2.3, pitchY / 1.52);
  function desk(x, y, w, d, f) {
    const h = 0.78 * f,
      leg = 0.065 * f,
      inset = 0.11 * f;
    floorPatch(x + 0.075 * f, y + 0.1 * f, w, d, "#64694d17");
    for (const [a, b] of [
      [inset, inset],
      [w - inset - leg, inset],
      [inset, d - inset - leg],
      [w - inset - leg, d - inset - leg],
    ])
      box(x + a, y + b, 0.012, leg, leg, h, ["#849084", "#7c877b", "#a3ab9c"]);
    box(x + 0.07 * f, y + 0.08 * f, h - 0.1 * f, w - 0.14 * f, d - 0.16 * f, 0.11 * f, [
      "#928373",
      "#9f937e",
      "#b5a68d",
    ]);
    box(x, y, h, w, d, 0.085 * f, ["#d9bb90", "#b29979", "#bea180"], "#9c8c754f");
    line(
      [x + 0.08 * f, y + 0.1 * f, h + 0.087 * f],
      [x + w - 0.12 * f, y + 0.1 * f, h + 0.087 * f],
      "#e9d0aa",
      0.6,
    );
  }
  function chair(x, y, f, used) {
    const w = 0.46 * f,
      d = 0.47 * f,
      h = 0.43 * f,
      leg = 0.043 * f;
    floorPatch(x + 0.04 * f, y + 0.08 * f, w, d, "#66725f20");
    for (const [a, b] of [
      [0.05, 0.06],
      [0.38, 0.06],
      [0.05, 0.37],
      [0.38, 0.37],
    ])
      box(x + a * f, y + b * f, 0, leg, leg, h, ["#839287", "#737e74", "#9ba699"]);
    const colors = used ? ["#689377", "#3a644b", "#477758"] : ["#d8ddd3", "#a5afa2", "#bcc5b8"];
    box(x, y, h, w, d, 0.09 * f, colors);
    box(
      x,
      y + d - 0.055 * f,
      h + 0.05 * f,
      w,
      0.066 * f,
      0.38 * f,
      colors,
      used ? "#4a73574f" : "#929e904f",
    );
  }
  let seat = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns && r * columns + c < desks; c++) {
      const x = 1.03 + c * pitchX + (pitchX - 1.66 * factor) / 2;
      const y = 1.02 + r * pitchY + (pitchY - 1.27 * factor) / 2;
      const w = 1.66 * factor,
        d = 0.69 * factor;
      add(x + y + (w + d) / 2, () => desk(x, y, w, d, factor));
      for (const offset of [0.19, 1.01]) {
        if (seat >= seats) break;
        const cx = x + offset * factor,
          cy = y + 0.64 * factor;
        const used = seat++ < occupied;
        add(cx + cy + 0.48 * factor, () => chair(cx, cy, factor, used));
      }
    }
  }
  add(10.35, () => desk(9.05, 0.28, 1.66, 0.69, 1));
  function plant(x, y) {
    box(x - 0.2, y - 0.2, 0, 0.4, 0.4, 0.47, ["#c6b6a0", "#b5a78f", "#c8b8a0"]);
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4,
        dx = Math.cos(a),
        dy = Math.sin(a),
        h = 0.82 + (i % 4) * 0.145;
      polygon(
        [
          [x, y, 0.42],
          [x + dx * 0.29 - dy * 0.08, y + dy * 0.29 + dx * 0.08, h - 0.12],
          [x + dx * 0.48, y + dy * 0.48, h],
          [x + dx * 0.24 + dy * 0.06, y + dy * 0.24 - dx * 0.06, h - 0.22],
        ],
        ["#627e57", "#779166", "#476d52", "#839c72"][i % 4],
      );
    }
  }
  add(11.9, () => plant(11.51, 0.42));
  objects.sort((a, b) => a.depth - b.depth).forEach((object) => object.draw());
  if (record.capacity > seats) {
    ctx.fillStyle = "#3e5749";
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("First " + seats + " seats shown", 14, height - 12);
  }
}
