import type { AccountResearch } from "@/features/dialer/data/dialer-api";

export function AIPanel({
  research,
  status,
  contact,
}: {
  research: AccountResearch | null;
  status: "idle" | "loading" | "loaded" | "error";
  contact: { name: string; company: string; role: string | null } | null;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#F1F5F9] px-7 py-4">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]"
          style={{ animation: "live-pulse 1.4s ease-in-out infinite" }}
        />
        <span className="text-[10px] font-[700] uppercase tracking-[1px] text-[#CBD5E1]">
          Contexto IA
        </span>
        {contact && (
          <>
            <span className="text-[#E2E8F0]">·</span>
            <span className="truncate text-[12px] text-[#64748B]">
              {contact.name} · {contact.company}
            </span>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-7 py-5">
        {status === "idle" && (
          <p className="text-[13px] leading-[1.6] text-[#94A3B8]">
            O contexto de IA aparece aqui assim que a chamada conectar.
          </p>
        )}
        {status === "loading" && (
          <p className="text-[13px] leading-[1.6] text-[#94A3B8]">Gerando contexto…</p>
        )}
        {(status === "error" || (status === "loaded" && !research)) && (
          <p className="text-[13px] text-[#DC2626]">Não foi possível gerar o contexto.</p>
        )}
        {status === "loaded" && research && (
          <div className="space-y-5">
            {/* Empresa */}
            <section>
              <p className="mb-2 text-[10px] font-[700] uppercase tracking-[1px] text-[#CBD5E1]">
                Empresa
              </p>
              <p className="text-[13px] leading-[1.6] text-[#0F172A]">
                {research.companyOverview}
              </p>
            </section>

            <div className="h-px bg-[#F1F5F9]" />

            {/* Pessoa */}
            <section>
              <p className="mb-2 text-[10px] font-[700] uppercase tracking-[1px] text-[#CBD5E1]">
                Pessoa
              </p>
              <p className="text-[13px] leading-[1.6] text-[#0F172A]">
                {research.roleImportance}
              </p>
              {research.roleIndicators && (
                <p className="mt-1 text-[13px] leading-[1.6] text-[#64748B]">
                  {research.roleIndicators}
                </p>
              )}
            </section>

            {/* Battlecards */}
            {(research.objections.length > 0 || research.battlecards.length > 0) && (
              <>
                <div className="h-px bg-[#F1F5F9]" />
                <section>
                  <p className="mb-2 text-[10px] font-[700] uppercase tracking-[1px] text-[#CBD5E1]">
                    Battlecards
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {research.objections.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-[600] text-[#64748B]">
                          Objeções
                        </p>
                        <div className="space-y-2">
                          {research.objections.slice(0, 3).map((obj, i) => (
                            <div
                              key={i}
                              className="rounded-[6px] bg-[#F8FAFC] px-2.5 py-2"
                            >
                              <p className="text-[11px] font-[600] text-[#0F172A]">
                                {obj.objection}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-[1.4] text-[#64748B]">
                                {obj.response}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {research.battlecards.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-[600] text-[#64748B]">
                          Concorrentes
                        </p>
                        <div className="space-y-2">
                          {research.battlecards.slice(0, 2).map((bc, i) => (
                            <div
                              key={i}
                              className="rounded-[6px] bg-[#F8FAFC] px-2.5 py-2"
                            >
                              <p className="text-[11px] font-[600] text-[#0F172A]">
                                {bc.competitor}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-[1.4] text-[#64748B]">
                                {bc.ourEdge}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Script sugerido */}
            {research.callScript && (
              <>
                <div className="h-px bg-[#F1F5F9]" />
                <section>
                  <p className="mb-2 text-[10px] font-[700] uppercase tracking-[1px] text-[#CBD5E1]">
                    Script sugerido
                  </p>
                  <div className="flex gap-2">
                    <span className="mt-0.5 shrink-0 rounded-[4px] bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-[700] text-[#2563EB]">
                      Script
                    </span>
                    <p className="text-[12px] leading-[1.5] text-[#0F172A]">
                      {research.callScript}
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
