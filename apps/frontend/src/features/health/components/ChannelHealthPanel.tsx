import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Bar } from "@/components/ui/Bar";
import type { ChannelHealth } from "@/features/health/data/health";
import { WithdrawInvitesButton } from "@/features/health/components/WithdrawInvitesButton";

export function ChannelHealthPanel({ channel }: { channel: ChannelHealth }) {
  const isLinkedIn = channel.name === "LinkedIn";

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8.5 w-8.5 place-items-center rounded-[9px] border border-line bg-[#fafbfc] font-bold">
            {channel.icon}
          </div>
          <div>
            <b>{channel.name}</b>
            <span className="block text-[13px] text-muted">{channel.detail}</span>
          </div>
        </div>
        <Tag variant={channel.variant}>{channel.status}</Tag>
      </div>
      <div className="mt-4 grid gap-2.5">
        {channel.stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-[13px] text-muted">{stat.label}</span>
            <b>{stat.value}</b>
          </div>
        ))}
        {channel.barPercent !== undefined && <Bar percent={channel.barPercent} />}
        {isLinkedIn && <WithdrawInvitesButton />}
        <div className="text-[10px] leading-relaxed text-muted">
          {channel.note}
        </div>
      </div>
    </Card>
  );
}
