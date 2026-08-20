import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  default: "border-line bg-panel text-foreground",
  info: "border-[#c7d7fe] bg-[#eff4ff] text-[#1849a9]",
  ok: "border-[#abefc6] bg-[#ecfdf3] text-ok",
  warn: "border-[#fedf89] bg-[#fffaeb] text-warn",
  bad: "border-[#fecdca] bg-[#fef3f2] text-bad",
} as const;

export function Tag({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
