export function InsightPill({
  insight,
  isLoading,
  error,
}: {
  insight: string | null;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex items-start gap-2 rounded-full border border-[#c7d7fe] bg-[#eff4ff] px-3.5 py-2 text-[13px] text-[#1849a9]">
      <span aria-hidden className="mt-px">
        ✨
      </span>
      <span>
        {error
          ? "Não foi possível gerar o insight agora."
          : isLoading
            ? "Gerando insight do dia…"
            : insight}
      </span>
    </div>
  );
}
