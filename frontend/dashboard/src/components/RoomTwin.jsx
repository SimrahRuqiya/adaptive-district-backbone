import { useEffect, useRef, useState } from "react";
import { drawRoom } from "../graphics/room.js";
import { DrawingCanvas } from "./DrawingCanvas.jsx";
import { Icon } from "./Icon.jsx";

function SeatLegend() {
  return (
    <div className="scene-foot">
      <div className="keys">
        <span>
          <b className="seat-key filled" />
          Occupied
        </span>
        <span>
          <b className="seat-key empty" />
          Available
        </span>
      </div>
      <span className="secondary">Illustrative seating</span>
    </div>
  );
}
export function RoomTwin({ reading, onExpand }) {
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    if (expanded) dialog.current.showModal();
  }, [expanded]);
  const label = `Illustrative room layout with ${reading.occupancy} people recorded, capacity ${reading.capacity}.`;
  const canvas = <DrawingCanvas label={label} draw={(node) => drawRoom(node, reading)} />;
  return (
    <section className="card spatial">
      <div className="card-head">
        <h2>Room twin</h2>
        <button
          className="icon-btn"
          aria-label="Expand room view"
          onClick={() => {
            onExpand();
            setExpanded(true);
          }}
        >
          <Icon name="expand" />
        </button>
      </div>
      <div className="scene-wrap">
        <span className="view-tag">
          <Icon name="layers" />
          Isometric view
        </span>
        {canvas}
      </div>
      <SeatLegend />
      {expanded && (
        <dialog
          ref={dialog}
          onClose={() => setExpanded(false)}
          aria-label={"Expanded view of room " + reading.room}
        >
          <div className="card-head">
            <h2>Room {reading.room} · Room twin</h2>
            <button
              autoFocus
              className="icon-btn"
              aria-label="Close expanded view"
              onClick={() => dialog.current.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="scene-wrap large">{canvas}</div>
          <SeatLegend />
        </dialog>
      )}
    </section>
  );
}
