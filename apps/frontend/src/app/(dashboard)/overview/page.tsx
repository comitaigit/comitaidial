import type { Metadata } from "next";
import { OverviewPageContent } from "@/features/overview/components/OverviewPageContent";

export const metadata: Metadata = {
  title: "Visão geral",
};

// Client-fetched — see calls/page.tsx's comment: /overview also requires
// the Bearer access token, which only lives in the client-side session store.
export default function OverviewPage() {
  return <OverviewPageContent />;
}
