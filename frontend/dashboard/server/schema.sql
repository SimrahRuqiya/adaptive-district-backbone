CREATE TABLE IF NOT EXISTS readings (
  timestamp TEXT NOT NULL,
  room TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  occupancy INTEGER NOT NULL CHECK (occupancy >= 0),
  co2 REAL,
  temperature REAL,
  humidity REAL,
  illuminance REAL,
  predicted_class TEXT,
  predicted_occupancy_ratio REAL,
  predicted_people_30min REAL,
  PRIMARY KEY (room, timestamp)
);
