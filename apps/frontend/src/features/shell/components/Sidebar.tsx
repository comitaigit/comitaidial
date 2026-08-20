"use client";

import { cn } from "@/lib/cn";
import { useSidebar } from "@/features/shell/hooks/useSidebar";
import { SidebarBrand } from "@/features/shell/components/SidebarBrand";
import { SidebarSectionLabel } from "@/features/shell/components/SidebarSectionLabel";
import { NavLink } from "@/features/shell/components/NavLink";

export function Sidebar() {
  const { operationItems, managementItems, isActive, collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col overflow-visible bg-dark px-2 py-4 text-white transition-[width] duration-200 ease-in-out",
        collapsed ? "w-17" : "w-59.5"
      )}
    >
      <SidebarBrand collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className="flex-1 overflow-y-auto overflow-x-visible">
        <SidebarSectionLabel collapsed={collapsed}>Operação</SidebarSectionLabel>
        {operationItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}

        <SidebarSectionLabel collapsed={collapsed}>Gestão</SidebarSectionLabel>
        {managementItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </div>
    </aside>
  );
}
