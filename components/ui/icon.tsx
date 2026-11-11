const PATHS = {
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M8.5 12l2.5 2.5L15.5 10"],
  cash: ["M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z", "M12 9a3 3 0 100 6 3 3 0 000-6z"],
  truck: ["M2 6h11v10H2z", "M13 9h5l3 3v4h-8", "M7 15a2 2 0 100 4 2 2 0 000-4z", "M17 15a2 2 0 100 4 2 2 0 000-4z"],
  help: ["M4 14v-2a8 8 0 0116 0v2", "M3 14h4v6H4a1 1 0 01-1-1z", "M17 14h4v5a1 1 0 01-1 1h-3z"],
  chat: ["M21 12a8 8 0 01-11.7 7L4 20l1.2-4.6A8 8 0 1121 12z"],
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