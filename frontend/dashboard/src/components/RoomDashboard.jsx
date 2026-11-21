import { useEffect, useState } from "react";
import { RoomTwin } from "./RoomTwin.jsx";
import { OccupancyCard } from "./OccupancyCard.jsx";
import { Playback } from "./Playback.jsx";
import { SensorPanel } from "./SensorPanel.jsx";
import { OccupancyHistory } from "./OccupancyHistory.jsx";
import { DataLog } from "./DataLog.jsx";

export function RoomDashboard({ records, source, view, onView }) {
  // A null selection follows the newest reading after refresh. A historical
  // selection stays anchored to its timestamp if the API inserts older rows.
  const [selectedTime, setSelectedTime] = useState(null);
  const [playing, setPlaying] = useState(false);
  const last = records.length - 1;
  const match = selectedTime === null ? -1 : records.findIndex((row) => row.time === selectedTime);
  const frame = match < 0 ? last : match;
  const reading = records[frame];
  function seek(index) {
    setPlaying(false);
    setSelectedTime(index === last ? null : records[index].time);
  }
  useEffect(() => {
    if (!playing) return;
    if (view !== "overview" || frame >= last) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      const next = frame + 1;
      setSelectedTime(next === last ? null : records[next].time);
      if (next === last) setPlaying(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [playing, records, frame, last, view]);
  useEffect(() => {
    const pauseHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pauseHidden);
    return () => document.removeEventListener("visibilitychange", pauseHidden);
  }, []);
  if (view === "log")
    return (
      <DataLog
        records={records}
        source={source}
        onSelect={(time) => {
          setSelectedTime(time);
          setPlaying(false);
          onView("overview");
          window.scrollTo(0, 0);
        }}
      />
    );
  return (
    <section aria-label="Room overview">
      <div className="hero">
        <RoomTwin reading={reading} onExpand={() => setPlaying(false)} />
        <OccupancyCard reading={reading} />
      </div>
      <Playback
        records={records}
        frame={frame}
        playing={playing}
        onSeek={seek}
        onToggle={() => {
          if (!playing && frame === last) setSelectedTime(records[0].time);
          setPlaying(!playing);
        }}
      />
      <SensorPanel records={records} frame={frame} />
      <OccupancyHistory records={records} frame={frame} />
    </section>
  );
}
