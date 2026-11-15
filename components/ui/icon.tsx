const PATHS = {
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M8.5 12l2.5 2.5L15.5 10"],
  cash: ["M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z", "M12 9a3 3 0 100 6 3 3 0 000-6z"],
  truck: ["M2 6h11v10H2z", "M13 9h5l3 3v4h-8", "M7 15a2 2 0 100 4 2 2 0 000-4z", "M17 15a2 2 0 100 4 2 2 0 000-4z"],
  help: ["M4 14v-2a8 8 0 0116 0v2", "M3 14h4v6H4a1 1 0 01-1-1z", "M17 14h4v5a1 1 0 01-1 1h-3z"],
  chat: ["M21 12a8 8 0 01-11.7 7L4 20l1.2-4.6A8 8 0 1121 12z"],
  cart: ["M3 4h2l2.5 11h10l2-8H6.5", "M9 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z", "M17 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  tool: ["M14 6a4 4 0 005 5l-9 9a2 2 0 01-3-3z"],
  search: ["M11 4a7 7 0 100 14 7 7 0 000-14z", "M21 21l-5-5"],
  close: ["M6 6l12 12", "M18 6L6 18"],
    phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"],
  mail: ["M3 6h18v12H3z", "M3 7l9 6 9-6"],
  location: ["M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z", "M12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"],
  clock: ["M12 3a9 9 0 100 18 9 9 0 000-18z", "M12 7v5l3 2"],
  youtube: ["M3 8a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3z", "M10 9l5 3-5 3z"],
  facebook: ["M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 011-1z"],
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 24,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}