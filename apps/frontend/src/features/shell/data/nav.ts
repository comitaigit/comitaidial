export type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: string;
};

export const OPERATION_ITEMS: NavItem[] = [
  { href: "/overview", label: "Visão geral", icon: "▦" },
  { href: "/dialer", label: "Dialer", icon: "☎", badge: "P0" },
  { href: "/calls", label: "Chamadas", icon: "▥" },
  { href: "/inbox", label: "Inbox unificada", icon: "▣", badge: "3" },
  { href: "/accounts", label: "Accounts", icon: "▤" },
  { href: "/people", label: "Prospects", icon: "◎" },
  { href: "/sequences", label: "Cadências", icon: "↻" },
  { href: "/signals", label: "Sinais", icon: "⚡" },
];

export const MANAGEMENT_ITEMS: NavItem[] = [
  { href: "/metrics", label: "Performance", icon: "⌁" },
  { href: "/health", label: "Saúde dos canais", icon: "♡" },
  { href: "/settings", label: "Workspace", icon: "⚙" },
];
