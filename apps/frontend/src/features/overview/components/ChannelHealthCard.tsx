import Link from "next/link";
import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import type { ChannelHealthSummary } from "@/features/overview/data/overview";

export function ChannelHealthCard({
  channels,
}: {
  channels: ChannelHealthSummary[];
}) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Saúde rápida</CardTitle>
        <Link href="/health">
          <Button size="small">Ver detalhes</Button>
        </Link>
      </CardHead>
      <CardBody>
        {channels.map((channel, i) => (
          <div
            key={channel.name}
            className={`flex items-center justify-between py-3 ${
              i < channels.length - 1 ? "border-b border-[#eceef2]" : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="grid h-8.5 w-8.5 place-items-center rounded-[9px] border border-line bg-[#fafbfc] font-bold">
                {channel.icon}
              </div>
              <div>
                <b>{channel.name}</b>
                <div className="text-[13px] text-muted">{channel.detail}</div>
              </div>
            </div>
            <Tag variant={channel.variant}>{channel.status}</Tag>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
