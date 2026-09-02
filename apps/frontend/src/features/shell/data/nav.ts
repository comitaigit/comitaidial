export type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: string;
  badgeVariant?: "danger" | "warning";
};

export const NAV_GROUP1: NavItem[] = [
  { href: "/overview", label: "Visão geral", icon: "▦" },
  { href: "/funnel", label: "Meu Funil", icon: "▽" },
  { href: "/dialer", label: "Dialer", icon: "☎" },
  { href: "/calls", label: "Call Check", icon: "▥" },
  { href: "/inbox", label: "Inbox unificada", icon: "▣", badge: "4", badgeVariant: "danger" },
];

export const NAV_GROUP2: NavItem[] = [
  { href: "/sequences", label: "Cadências", icon: "↻" },
  { href: "/people", label: "Prospects", icon: "◎" },
  { href: "/signals", label: "Sinais", icon: "⚡", badge: "2", badgeVariant: "warning" },
  { href: "/metrics", label: "KPI Targets", icon: "⌁" },
  { href: "/health", label: "Saúde dos canais", icon: "♡" },
  { href: "/accounts", label: "Accounts", icon: "▤" },
];

// Legacy exports kept for any other consumer that hasn't been updated yet.
export const OPERATION_ITEMS: NavItem[] = NAV_GROUP1;
export const MANAGEMENT_ITEMS: NavItem[] = NAV_GROUP2;
