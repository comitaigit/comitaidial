import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  padded = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-panel",
        padded && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line px-4 py-3.5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  level = 2,
}: {
  children: ReactNode;
  level?: 2 | 3;
}) {
  if (level === 3) {
    return <h3 className="m-0 text-sm font-semibold">{children}</h3>;
  }
  return <h2 className="m-0 text-base font-semibold">{children}</h2>;
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
