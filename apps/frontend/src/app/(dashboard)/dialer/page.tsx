import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tag } from "@/components/ui/Tag";
import { getDialerBlock } from "@/features/dialer/data/dialer";
import { DialerStage } from "@/features/dialer/components/DialerStage";
import { ChangeListButton } from "@/features/dialer/components/ChangeListButton";

export const metadata: Metadata = {
  title: "Dialer",
};

export default async function DialerPage() {
  const block = await getDialerBlock();

  return (
    <section>
      <PageHeader
        title="Dialer"
        subtitle="Discagem paralela com contexto de conta e outcome obrigatório."
        actions={
          <>
            <Tag variant="info">Paralelismo: {block.parallelism}x</Tag>
            <ChangeListButton />
          </>
        }
      />
      <DialerStage block={block} />
    </section>
  );
}
