export function PersonAvatar({
  initials,
  name,
  subtitle,
}: {
  initials: string;
  name: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef0f4] text-sm font-bold">
        {initials}
      </div>
      <div>
        <b className="block text-[13px]">{name}</b>
        {subtitle && <span className="text-[11px] text-muted">{subtitle}</span>}
      </div>
    </div>
  );
}
