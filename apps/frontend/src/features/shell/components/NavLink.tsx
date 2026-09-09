import Link from "next/link";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/Tooltip";
import type { NavItem } from "@/features/shell/data/nav";

export function NavLink({
  href,
  label,
  icon,
  badge,
  badgeVariant,
  active,
  collapsed,
}: NavItem & { active: boolean; collapsed: boolean }) {
  const link = (
    <Link
      href={href}
      className={cn(
        "my-px flex w-full items-center gap-[9px] rounded-[6px] px-2.5 py-[7px] text-[12.5px] transition-colors duration-150",
        collapsed ? "justify-center" : "justify-between",
        active
          ? "bg-[#2563EB] font-semibold text-white"
          : "font-normal text-[#4a4a4a] hover:text-[#a1a1aa]",
      )}
    >
      <span className="flex items-center gap-[9px] overflow-hidden">
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out",
            collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
          )}
        >
          {label}
        </span>
      </span>
      {badge && !collapsed && (
        <span
          className={cn(
            "ml-auto flex min-w-[16px] items-center justify-center rounded-full px-1 py-px text-[9px] font-bold text-white",
            badgeVariant === "danger" ? "bg-[#EF4444]" : "bg-[#F59E0B]",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip label={badge ? `${label} · ${badge}` : label}>{link}</Tooltip>
  );
}
