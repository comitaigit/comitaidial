import Link from "next/link";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/Tooltip";
import type { NavItem } from "@/features/shell/data/nav";

export function NavLink({
  href,
  label,
  icon,
  badge,
  active,
  collapsed,
}: NavItem & { active: boolean; collapsed: boolean }) {
  const link = (
    <Link
      href={href}
      className={cn(
        "my-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[#cbd0d8] transition-colors duration-150",
        collapsed ? "justify-center" : "justify-between",
        active ? "bg-dark-2 text-white" : "hover:bg-dark-2 hover:text-white"
      )}
    >
      <span className="flex items-center gap-2.5 overflow-hidden">
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out",
            collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
          )}
        >
          {label}
        </span>
      </span>
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out",
          collapsed || !badge ? "max-w-0 opacity-0" : "max-w-10 opacity-100"
        )}
      >
        {badge && (
          <span className="rounded-full border border-[#424753] px-1.5 py-0.5 text-[10px]">
            {badge}
          </span>
        )}
      </span>
    </Link>
  );

  if (!collapsed) return link;

  return <Tooltip label={badge ? `${label} · ${badge}` : label}>{link}</Tooltip>;
}
