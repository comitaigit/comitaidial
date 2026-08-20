import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  default: "border-line bg-panel text-[#20242b] hover:bg-[#f8f9fb]",
  primary: "border-accent bg-accent text-white hover:brightness-105",
  bad: "border-[#f5b7b1] bg-panel text-bad hover:bg-[#fef3f2]",
} as const;

const SIZES = {
  default: "px-3 py-2 text-sm",
  small: "px-2.5 py-1.5 text-xs",
} as const;

export function Button({
  variant = "default",
  size = "default",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}) {
  return (
    <button
      className={cn(
        "cursor-pointer rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
