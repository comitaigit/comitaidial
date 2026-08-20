import type { ReactNode } from "react";

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-dark-2 px-2 py-1 text-xs text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-opacity delay-150 group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
