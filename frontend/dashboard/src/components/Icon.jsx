import React from "react";
const glyphs = {
  upload: (
    <>
      <path d="M12 15V3m-5 5 5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </>
  ),
  room: (
    <>
      <path d="M3 21h18M6 21V4l10-1v18M9 7h1m-1 4h1m-1 4h1m6-6h3v12" />
    </>
  ),
  chevron: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  expand: (
    <>
      <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5" />
    </>
  ),
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-10m-6 0h6v6" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  play: (
    <>
      <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />
    </>
  ),
  pause: (
    <>
      <path d="M8 5v14m8-14v14" strokeWidth="4" />
    </>
  ),
  previous: (
    <>
      <path d="M6 5v14m12-13-9 6 9 6z" />
    </>
  ),
  next: (
    <>
      <path d="M18 5v14M6 6l9 6-9 6z" />
    </>
  ),
  wind: (
    <>
      <path d="M3 8h11a3 3 0 1 0-3-3M2 12h16a3 3 0 1 0-2-5M5 16h7a3 3 0 1 1-3 3" />
    </>
  ),
  temperature: (
    <>
      <path d="M8.5 14V6a3.5 3.5 0 0 1 7 0v8a5.5 5.5 0 1 1-7 0Zm3.5 2V8m6-1h3m-3 4h2" />
      <circle cx="12" cy="17.5" r="1.3" />
    </>
  ),
  drop: (
    <>
      <path d="M12 2c-2 4-7 9-7 13a7 7 0 0 0 14 0c0-4-5-9-7-13Z" />
      <path d="M8.5 15a3.5 3.5 0 0 0 3.5 3.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  file: (
    <>
      <path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8m-8 4h8" />
    </>
  ),
  close: (
    <>
      <path d="m5 5 14 14M19 5 5 19" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 8a7 7 0 0 1 12-2l2 3M4 15l2 3a7 7 0 0 0 12-2" />
    </>
  ),
};
export function Icon({ name }) {
  return (
    <i data-icon={name} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyphs[name]}
      </svg>
    </i>
  );
}
