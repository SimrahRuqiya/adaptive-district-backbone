export function canvasSurface(canvas) {
  const box = canvas.getBoundingClientRect();
  if (box.width < 1 || box.height < 1) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = Math.round(box.width * dpr),
    h = Math.round(box.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, box.width, box.height);
  return { ctx, width: box.width, height: box.height };
}
