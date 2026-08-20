import { cn } from "@/lib/cn";

export function SidebarSectionLabel({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: string;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
        collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      )}
    >
      <p className="overflow-hidden whitespace-nowrap px-2.5 pb-1.5 pt-3.5 text-[10px] uppercase tracking-widest text-[#777f8d]">
        {children}
      </p>
    </div>
  );
}
