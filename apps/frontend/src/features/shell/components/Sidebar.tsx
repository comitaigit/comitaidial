"use client";

import { cn } from "@/lib/cn";
import { useSidebar } from "@/features/shell/hooks/useSidebar";
import { SidebarBrand } from "@/features/shell/components/SidebarBrand";
import { NavLink } from "@/features/shell/components/NavLink";

export function Sidebar() {
  const { group1Items, group2Items, isActive, collapsed, toggleCollapsed, user, userInitials } =
    useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col overflow-visible bg-[#111111] transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[60px]" : "w-[216px]",
      )}
    >
      <SidebarBrand collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className="flex flex-1 flex-col gap-px overflow-y-auto overflow-x-visible px-2 py-2.5">
        {group1Items.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}

        <div className="mx-2 my-2 h-px shrink-0 bg-[#1e1e1e]" />

        {group2Items.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </div>

      {/* User section */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-[9px] border-t border-[#1e1e1e] px-3.5 py-3",
          collapsed && "justify-center",
        )}
      >
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#1d3461] text-[10px] font-bold text-[#93b4f7]">
          {userInitials}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-[#d1d5db]">
              {user?.name ?? "…"}
            </div>
            <div className="text-[10px] text-[#3a3a3a]">{user?.role ?? ""}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
