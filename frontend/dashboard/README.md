# District Twin

A React dashboard for the Adaptive District Backbone digital twin. It fetches readings on startup and when **Refresh data** is selected. The room selector, seat count, environmental readings, forecasts, playback timeline and data log all come from the response.

## Run with the supplied recording

Use Node.js 22.13 or newer. From the directory containing `package.json`, run

```sh
npm install
npm run demo
```

Open the local URL printed by Vite. Demo mode imports `sample/edge_predictions.csv` into `server/.local/demo.sqlite`. The browser then requests `GET /api/readings`, and the server queries SQLite for each request. Rerunning the demo resets that sample database from the CSV.

**Import CSV** lets you inspect another recording locally. **Load API data** reconnects to the configured source. The room model illustrates occupancy counts. Actual seat coordinates would require a separate room layout dataset.

## Connect the project database

Have the backend expose the readings as JSON over HTTP. Keep the database driver and credentials on that server. The frontend's default endpoint is `/api/readings`.

- **Existing API** — Set `readingsUrl` in `public/dashboard-config.json` to your endpoint, then run `npm run dev`. An endpoint on another origin must allow requests from the dashboard origin.
- **Local backend with the same route** — Keep the default endpoint. Set `TWIN_API_ORIGIN` in `.env.local` to the backend origin and run `npm run dev`. Vite forwards `/api` requests to that backend. Restart Vite after editing `.env.local`.
- **SQLite file with the supplied schema** — Set `TWIN_DB_PATH` in `.env.local` to its absolute path, leave `TWIN_API_ORIGIN` unset, and run `npm run dev`. The adapter opens the database read-only. See `server/schema.sql` for the table definition.

For production, run `npm run build`, serve `dist/` over HTTP, and point the deployed `dashboard-config.json` at your backend. You can change this file after deployment. The SQLite middleware and development proxy run in Vite's development and preview servers. A static deployment needs its own backend endpoint.

### Readings API

Return HTTP 200 with JSON containing a `readings` array and an optional `source` display name. An empty array represents a successful request with no readings. The client also accepts a bare array. For example, an empty response is

```json
{ "source": "Building telemetry", "readings": [] }
```

Each object in the array represents one reading for one room.

| Field | Expected value |
| --- | --- |
| `timestamp` | ISO date and time. Use unique timestamps per room to millisecond precision. Zoned timestamps display in UTC. Unzoned timestamps retain the source clock. Use one convention per response. |
| `room` | Room identifier, as a string or number |
| `capacity`, `occupancy` | Positive whole-number capacity and nonnegative whole-number occupancy |
| `co2`, `temperature`, `humidity`, `illuminance` | CO₂ in ppm, temperature in °C, relative humidity in %, and illuminance in lux |
| `predicted_class` | Model's occupancy class label |
| `predicted_occupancy_ratio` | Predicted fraction of capacity. A value of 0.5 means 50%. |
| `predicted_people_30min` | Expected number of people 30 minutes after the reading, including fractional estimates |

The four identity and occupancy fields are required. Sensor and prediction fields accept null or may be omitted. Numeric fields also accept numeric strings from database drivers. The client sorts by timestamp, groups by room, and plots forecasts at their target time. Return the history window you want available for replay.

## Where to make changes

| Location | Responsibility |
| --- | --- |
| `public/dashboard-config.json` | Runtime API URL |
| `src/api/readings.js` | Fetch settings, HTTP errors, and JSON response handling |
| `src/hooks/useReadings.js` | Requests, refresh, cancellation, CSV import, loading and error state |
| `shared/readings.js` | Field validation, room grouping and time order |
| `src/components/` | Room twin, occupancy card, playback, environmental sensors, history and data log |
| `src/graphics/` | Canvas drawing and forecast alignment |
| `server/sqlite.js` | Optional local database adapter |

Run `npm test` to check the client and database adapter with empty results, multiple rooms, updated rows, missing sensor values and forecast alignment.
