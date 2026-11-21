import { clock, dayFmt } from "../../shared/time.js";
import { Icon } from "./Icon.jsx";

export function Playback({ records, frame, playing, onToggle, onSeek }) {
  const time = records[frame].time,
    last = records.length - 1;
  const label = playing ? "Pause recording" : "Play recording";
  return (
    <section className="replay card" aria-label="Recording playback">
      <div className="playback-buttons">
        <button className="play-btn" onClick={onToggle} disabled={!last} aria-label={label} title={label}>
          <Icon name={playing ? "pause" : "play"} />
        </button>
        <button
          className="step"
          onClick={() => onSeek(frame - 1)}
          disabled={!frame}
          aria-label="Previous reading"
        >
          <Icon name="previous" />
        </button>
        <button
          className="step"
          onClick={() => onSeek(frame + 1)}
          disabled={frame === last}
          aria-label="Next reading"
        >
          <Icon name="next" />
        </button>
      </div>
      <div className="replay-meta">
        <strong>{clock(time, true)}</strong>
        <span>{dayFmt.format(time)}</span>
      </div>
      <div className="scrubber">
        <input
          type="range"
          aria-label="Recording frame"
          aria-valuetext={`Reading ${frame + 1} of ${records.length}, ${dayFmt.format(time)} ${clock(time, true)}`}
          min={0}
          max={last}
          step={1}
          value={frame}
          disabled={!last}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{ "--percent": (last ? (100 * frame) / last : 100) + "%" }}
        />
      </div>
      <span className="frame-count">
        {frame + 1} / {records.length}
      </span>
    </section>
  );
}
