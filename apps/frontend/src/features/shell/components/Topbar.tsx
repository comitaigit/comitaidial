"use client";

import { Button } from "@/components/ui/Button";
import { useTopbar } from "@/features/shell/hooks/useTopbar";

export function Topbar() {
  const { user, activeCadenceLabel, handleLogout } = useTopbar();
  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-line bg-panel px-4 sm:px-5.5">
      <div>
        <b className="block text-sm">Workspace Comitai</b>
        <span className="text-xs text-muted">
          {activeCadenceLabel ?? "Nenhuma cadência selecionada no Dialer"}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#12b76a]" aria-hidden />
        <span className="hidden text-[13px] text-muted sm:inline">
          {user?.name ?? "…"}
        </span>
        <div className="grid h-8 w-8 place-items-center rounded-full border border-line bg-[#e9edf3] font-bold">
          {initial}
        </div>
        <Button size="small" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </header>
  );
}
