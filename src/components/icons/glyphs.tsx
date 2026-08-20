import type { ReactNode } from 'react';

/**
 * Original glyph geometry for the Verandah icon set. Every path is drawn on a
 * 24×24 grid with a 1.5 stroke, optical centre at (12, 12), and 2px padding.
 */
export const glyphs = {
  // ── Navigation & chrome ──────────────────────────────────────────────
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </>
  ),
  chevronLeft: <path d="m14.5 5-7 7 7 7" />,
  chevronRight: <path d="m9.5 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  check: <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m15.6 15.6 3.9 3.9" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.66 0l2.84-2.84a4 4 0 0 0-5.66-5.66l-1.2 1.2" />
      <path d="M14 10a4 4 0 0 0-5.66 0L5.5 12.84a4 4 0 0 0 5.66 5.66l1.2-1.2" />
    </>
  ),
  external: (
    <>
      <path d="M13.5 5H19v5.5" />
      <path d="M19 5 11 13" />
      <path d="M18 14.5V18a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5H10" />
    </>
  ),
  photos: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="m4.5 17 4.2-4.2a1.5 1.5 0 0 1 2.1 0L15 16.6" />
      <path d="m14 14.4 1.6-1.6a1.5 1.5 0 0 1 2.1 0l2 2" />
    </>
  ),

  // ── Status ───────────────────────────────────────────────────────────
  info: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11.5v5" />
      <path d="M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.5 2.9 19.5h18.2z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  circleCheck: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </>
  ),
  circleCross: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m9.4 9.4 5.2 5.2" />
      <path d="m14.6 9.4-5.2 5.2" />
    </>
  ),
  spinner: (
    <>
      <circle cx="12" cy="12" r="8" opacity="0.25" />
      <path d="M20 12a8 8 0 0 0-8-8" />
    </>
  ),

  // ── Contact & location ───────────────────────────────────────────────
  phone: (
    <path d="M6.2 4h3l1.4 3.6-2 1.4a10.5 10.5 0 0 0 5.4 5.4l1.4-2 3.6 1.4v3a1.6 1.6 0 0 1-1.8 1.6C10.6 17.7 6.3 13.4 4.6 5.8A1.6 1.6 0 0 1 6.2 4Z" />
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="m4.5 7.5 6.6 5a1.5 1.5 0 0 0 1.8 0l6.6-5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21c4-4.6 6-8 6-10.8A6 6 0 0 0 6 10.2C6 13 8 16.4 12 21Z" />
      <circle cx="12" cy="10.2" r="2.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="9" r="3.25" />
      <path d="M4 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.6a3.25 3.25 0 0 1 0 6.3" />
      <path d="M17 14.6a5.5 5.5 0 0 1 3 4.9" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m15.2 8.8-1.7 4.7-4.7 1.7 1.7-4.7z" />
    </>
  ),

  // ── Home & amenity vocabulary ────────────────────────────────────────
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 12v7.5h12V12" />
    </>
  ),
  bed: (
    <>
      <path d="M3.5 18V8" />
      <path d="M3.5 12.5h17V18" />
      <path d="M20.5 15h-17" />
      <circle cx="8" cy="10" r="1.6" />
      <path d="M11.5 12.5V11a1.5 1.5 0 0 1 1.5-1.5h5.5a2 2 0 0 1 2 2v1" />
    </>
  ),
  bath: (
    <>
      <path d="M3.5 12.5h17v2a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4z" />
      <path d="M6 12.5v-6A2 2 0 0 1 9.6 5.3" />
      <path d="M8.5 7.5h3" />
      <path d="M7 19.5 6 21" />
      <path d="m17 19.5 1 1.5" />
    </>
  ),
  shower: (
    <>
      <path d="M6 20V7a3 3 0 0 1 6 0v1" />
      <path d="M10.5 10.5h9l-4.5 3.5z" />
      <path d="M12 17h.01" />
      <path d="M15 19h.01" />
      <path d="M18 16h.01" />
    </>
  ),
  pool: (
    <>
      <path d="M3 17.5c1.8 0 1.8-1.5 3.6-1.5s1.8 1.5 3.6 1.5 1.8-1.5 3.6-1.5S15.6 17.5 17.4 17.5 19.2 16 21 16" />
      <path d="M3 21c1.8 0 1.8-1.5 3.6-1.5S8.4 21 10.2 21s1.8-1.5 3.6-1.5S15.6 21 17.4 21s1.8-1.5 3.6-1.5" />
      <path d="M8 15.5V5.5A2 2 0 0 1 12 5.5" />
      <path d="M16 15V5" />
      <path d="M8 9.5h8" />
    </>
  ),
  wifi: (
    <>
      <path d="M3.5 9.2a13 13 0 0 1 17 0" />
      <path d="M6.6 12.6a8.5 8.5 0 0 1 10.8 0" />
      <path d="M9.6 16a4 4 0 0 1 4.8 0" />
      <path d="M12 19.4h.01" />
    </>
  ),
  parking: (
    <>
      <path d="M5 16.5 6.6 11A2 2 0 0 1 8.5 9.5h7A2 2 0 0 1 17.4 11L19 16.5" />
      <path d="M3.5 16.5h17V19h-3v-2.5" />
      <path d="M7.5 19v-2.5" />
      <circle cx="7.2" cy="13.8" r=".6" fill="currentColor" stroke="none" />
      <circle cx="16.8" cy="13.8" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  kitchen: (
    <>
      <path d="M7 3.5v8a2.5 2.5 0 0 0 5 0v-8" />
      <path d="M9.5 11.5V20.5" />
      <path d="M17 3.5c-1.4 1.6-2 3.4-2 5.5s.6 2.5 2 2.5V20.5" />
    </>
  ),
  dining: (
    <>
      <path d="M4 8h16" />
      <path d="M6 8v3.5a6 6 0 0 0 12 0V8" />
      <path d="M12 14v6" />
      <path d="M8.5 20h7" />
    </>
  ),
  fridge: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
      <path d="M6 10h12" />
      <path d="M9 6.5v2" />
      <path d="M9 12.5v2.5" />
    </>
  ),
  tv: (
    <>
      <rect x="3.5" y="5" width="17" height="11.5" rx="1.5" />
      <path d="M8.5 20h7" />
      <path d="M12 16.5V20" />
    </>
  ),
  game: (
    <>
      <path d="M8.5 8.5h7a5 5 0 0 1 4.6 7l-.5 1.2a2 2 0 0 1-3.4.5L14.6 15H9.4l-1.6 2.2a2 2 0 0 1-3.4-.5l-.5-1.2a5 5 0 0 1 4.6-7Z" />
      <path d="M7.5 11.8v1.4" />
      <path d="M6.8 12.5h1.4" />
      <circle cx="16" cy="12" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  fire: (
    <>
      <path d="M12 3.5c3.4 3.2 5.5 6 5.5 9a5.5 5.5 0 0 1-11 0c0-1.6.7-3 2-4.4.2 1.4.9 2.2 2 2.4-.4-2.8.1-5.1 1.5-7Z" />
    </>
  ),
  garden: (
    <>
      <path d="M12 20v-6" />
      <path d="M12 14c-3.6 0-5.5-2-5.5-5.5C10 8.5 12 10.4 12 14Z" />
      <path d="M12 14c3.6 0 5.5-2 5.5-5.5C14 8.5 12 10.4 12 14Z" />
      <path d="M7 20h10" />
    </>
  ),
  balcony: (
    <>
      <path d="M4 12.5h16" />
      <path d="M4 12.5V20" />
      <path d="M20 12.5V20" />
      <path d="M9.3 12.5V20" />
      <path d="M14.7 12.5V20" />
      <path d="M4 16.5h16" />
      <path d="M7 9.5 12 5l5 4.5" />
    </>
  ),
  garage: (
    <>
      <path d="M3.5 20V9.5L12 4l8.5 5.5V20" />
      <path d="M7 20v-7h10v7" />
      <path d="M7 16.5h10" />
    </>
  ),
  workspace: (
    <>
      <rect x="4" y="5" width="16" height="10" rx="1.5" />
      <path d="M2.5 19h19" />
      <path d="M10 15v4" />
      <path d="M14 15v4" />
    </>
  ),
  crib: (
    <>
      <path d="M4 7v12" />
      <path d="M20 7v12" />
      <path d="M4 10.5h16" />
      <path d="M9.3 10.5V19" />
      <path d="M14.7 10.5V19" />
      <path d="M4 19h16" />
      <path d="M8 7V4.5" />
    </>
  ),
  wind: (
    <>
      <path d="M3.5 8.5h9a2.75 2.75 0 1 0-2.75-2.75" />
      <path d="M3.5 12.5h13a3 3 0 1 1-3 3" />
      <path d="M3.5 16.5h5.5" />
    </>
  ),
  linens: (
    <>
      <path d="M4.5 5.5h15v13h-15z" />
      <path d="M4.5 9.5h15" />
      <path d="M8 9.5v9" />
      <path d="M12 5.5v4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 4.5 13.6 9l4.5 1.6-4.5 1.6L12 16.7l-1.6-4.5L5.9 10.6 10.4 9z" />
      <path d="M18 16.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5.5 6v6c0 4 2.6 7 6.5 8.5 3.9-1.5 6.5-4.5 6.5-8.5V6z" />
      <path d="m9.4 12 1.9 1.9 3.5-3.8" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="8.5" r="4" />
      <path d="m11.4 11.4 8 8" />
      <path d="m16.5 16.5 2-2" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof glyphs;
