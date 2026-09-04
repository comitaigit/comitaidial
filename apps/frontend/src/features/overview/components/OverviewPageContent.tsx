"use client";

import Link from "next/link";
import { useOverviewPage } from "@/features/overview/hooks/useOverviewPage";
import { HeroMetric } from "@/features/overview/components/HeroMetric";
import { HomeTaskManager } from "@/features/overview/components/HomeTaskManager";
import { CargoTables } from "@/features/overview/components/CargoTables";
import { CallHeatmap } from "@/features/overview/components/CallHeatmap";
import { FooterStats } from "@/features/overview/components/FooterStats";

// Empty heatmap until /overview/heatmap endpoint is available.
const EMPTY_HOURS = ["8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h"];
const EMPTY_DAYS: string[] = [];
const EMPTY_DATA: number[][] = [];

export function OverviewPageContent() {
  const {
    greeting,
    dateStr,
    conversations,
    meetingsScheduled,
    isKpisLoading,
    homeTasks,
    pendingCount,
    doneCount,
    isTasksLoading,
    tasksError,
    footerCalls,
    footerConnectionRate,
  } = useOverviewPage();

  return (
    <div className="text-[#0f172a]">
      {/* TopBar: greeting + date + CTA */}
      <div className="mb-7 flex items-baseline justify-between">
        <div>
          <span className="text-[15px] font-medium text-[#0f172a]">{greeting}</span>
          {greeting && <span className="mx-2 text-[15px] text-[#cbd5e1]">·</span>}
          <span className="text-[14px] text-[#94a3b8]">{dateStr}</span>
        </div>
        <Link
          href="/dialer"
          className="flex items-center gap-[7px] rounded-[8px] bg-[#0f172a] px-5 py-[9px] text-[13px] font-semibold tracking-[-0.2px] text-white transition-colors duration-150 hover:bg-[#1e293b]"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M2 2h2.2L5.5 4.8 4.2 5.8c.6 1.4 2.2 2.9 3.6 3.5l1.1-1.3 2.8 1.3v2.2c0 .4-.4.7-.8.6C4.2 10.8 1 7.5 1.5 3c0-.4.3-.8.5-1z"
              fill="white"
            />
          </svg>
          Iniciar Dialer
        </Link>
      </div>

      {/* Hero metric */}
      <HeroMetric
        conversations={conversations}
        meetingsScheduled={meetingsScheduled}
        isLoading={isKpisLoading}
      />

      <div className="mb-4 h-px bg-[#f1f5f9]" />

      {/* Task manager */}
      <HomeTaskManager
        tasks={homeTasks}
        pendingCount={pendingCount}
        doneCount={doneCount}
        isLoading={isTasksLoading}
        error={tasksError}
      />

      <div className="mb-4 h-px bg-[#f1f5f9]" />

      {/* Cargo breakdown tables */}
      <CargoTables conversations={[]} meetings={[]} />

      <div className="mb-4 h-px bg-[#f1f5f9]" />

      {/* Call heatmap */}
      <CallHeatmap data={EMPTY_DATA} hours={EMPTY_HOURS} days={EMPTY_DAYS} />

      {/* Footer stats */}
      <FooterStats calls={footerCalls} connectionRate={footerConnectionRate} />
    </div>
  );
}
