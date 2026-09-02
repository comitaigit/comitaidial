import { cn } from "@/lib/cn";

export function SidebarBrand({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-[#1e1e1e] px-[18px] pb-[18px] pt-5",
        collapsed ? "justify-center px-3" : "justify-start",
      )}
    >
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expandir menu" : "Encolher menu"}
        className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-[6px] bg-[#2563EB]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="2.4" fill="white" />
          <circle cx="12" cy="3.5" r="1.5" fill="white" opacity=".5" />
          <circle cx="12" cy="10.5" r="1.5" fill="white" opacity=".5" />
          <line x1="9.3" y1="5.6" x2="10.7" y2="4.3" stroke="white" strokeWidth="1.1" opacity=".5" strokeLinecap="round" />
          <line x1="9.3" y1="8.4" x2="10.7" y2="9.7" stroke="white" strokeWidth="1.1" opacity=".5" strokeLinecap="round" />
        </svg>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out",
          collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
        )}
      >
        <b className="block whitespace-nowrap text-[13px] font-bold tracking-tight text-white">
          Comitai Dialer
        </b>
      </div>
    </div>
  );
}
