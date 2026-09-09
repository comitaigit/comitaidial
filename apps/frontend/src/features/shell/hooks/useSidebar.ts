"use client";

import { usePathname } from "next/navigation";
import { NAV_GROUP1, NAV_GROUP2 } from "@/features/shell/data/nav";
import { useSidebarCollapse } from "@/features/shell/hooks/useSidebarCollapse";
import { useSessionStore } from "@/features/shell/stores/session-store";

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

export function useSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarCollapse();
  const user = useSessionStore((s) => s.user);

  function isActive(href: string) {
    return pathname === href;
  }

  return {
    group1Items: NAV_GROUP1,
    group2Items: NAV_GROUP2,
    // Legacy aliases
    operationItems: NAV_GROUP1,
    managementItems: NAV_GROUP2,
    isActive,
    collapsed,
    toggleCollapsed: toggle,
    user,
    userInitials: user ? deriveInitials(user.name) : "?",
  };
}
