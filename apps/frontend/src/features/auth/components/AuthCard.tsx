import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/Card";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-dark px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid h-11 w-11 place-items-center rounded-[11px] bg-white font-black text-[#111]">
            C
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <p className="mt-1 text-[13px] text-[#9ca3af]">{subtitle}</p>
          </div>
        </div>
        <Card className="bg-panel">
          <CardBody>{children}</CardBody>
        </Card>
      </div>
    </div>
  );
}
