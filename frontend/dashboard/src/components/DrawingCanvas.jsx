import { useLayoutEffect, useRef } from "react";

// React owns the element, its accessible name, and its lifetime. The renderer
// owns only the pixels. Redraw when either props or the CSS display size change.
export function DrawingCanvas({ draw, label, ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const paint = () => draw(canvas);
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);
  return (
    <canvas
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label || undefined}
      {...props}
    />
  );
}
