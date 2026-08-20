"use client";

import { usePathname } from "next/navigation";
import { OPERATION_ITEMS, MANAGEMENT_ITEMS } from "@/features/shell/data/nav";
import { useSidebarCollapse } from "@/features/shell/hooks/useSidebarCollapse";

export function useSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarCollapse();

  function isActive(href: string) {
    return pathname === href;
  }

  return {
    operationItems: OPERATION_ITEMS,
    managementItems: MANAGEMENT_ITEMS,
    isActive,
    collapsed,
    toggleCollapsed: toggle,
  };
}
