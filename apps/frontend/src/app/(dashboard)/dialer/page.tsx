import type { Metadata } from "next";
import { DialerStage } from "@/features/dialer/components/DialerStage";

export const metadata: Metadata = {
  title: "Dialer",
};

export default function DialerPage() {
  return <DialerStage />;
}
