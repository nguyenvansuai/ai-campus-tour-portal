import type { ComponentProps } from "react";

// Biểu tượng nét (24x24), tự vẽ để không thêm thư viện.
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0v16M8 7h7",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3m8-4h4v1a3 3 0 0 1-4 3m-4 3v4m-4 3h8",
  video: "M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm13 3 5-3v10l-5-3",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  check: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9",
  clipboard: "M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6m-6 4h4",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  badge: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm-4 0-1 7 5-3 5 3-1-7",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8",
  building: "M4 21V5l8-3v19M12 8h8v13M8 9h.01M8 13h.01M8 17h.01M16 12h.01M16 16h.01M2 21h20",
  calendar: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 4h16M8 2v4m8-4v4",
  cloud: "M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1 0 8z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  device: "M5 4h14v11H5zM2 20h20M9 15v5m6-5v5",
  menu: "M4 6h16M4 12h16M4 18h16",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  close: "M6 6l12 12M18 6 6 18",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4m-4-4h11",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className, ...props }: ComponentProps<"svg"> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-5"} {...props}>
      <path d={PATHS[name]} />
    </svg>
  );
}
