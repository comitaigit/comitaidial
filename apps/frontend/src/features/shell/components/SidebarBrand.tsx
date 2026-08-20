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
        "flex items-center gap-2.5 px-2 pb-5 pt-1",
        collapsed ? "justify-center" : "justify-start"
      )}
    >
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expandir menu" : "Encolher menu"}
        className="group relative grid h-8.5 w-8.5 shrink-0 cursor-pointer place-items-center rounded-[9px] bg-white font-black text-[#111]"
      >
        <span className="transition-opacity duration-150 group-hover:opacity-0">
          C
        </span>
        <span
          aria-hidden
          className="absolute text-base opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        >
          {collapsed ? "»" : "«"}
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out",
          collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
        )}
      >
        <b className="whitespace-nowrap text-[15px] tracking-tight">
          Comitai Dialer
        </b>
        <small className="mt-0.5 block whitespace-nowrap text-[11px] text-[#9ca3af]">
          V0 · low fidelity
        </small>
      </div>
    </div>
  );
}
