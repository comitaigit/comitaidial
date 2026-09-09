import Link from "next/link";
import { cn } from "@/lib/cn";
import type { HomeTask } from "@/features/overview/data/overview-api";

const TYPE_LABELS: Record<HomeTask["type"], string> = {
  call: "Call",
  meeting: "Reunião",
  followup: "Follow-up",
  proposal: "Proposta",
  email: "Email",
};

const TYPE_STYLE: Record<HomeTask["type"], string> = {
  call: "text-[#0f172a] bg-[#f1f5f9]",
  meeting: "text-[#16a34a] bg-[#f0fdf4]",
  followup: "text-[#dc2626] bg-[#fef2f2]",
  proposal: "text-[#7c3aed] bg-[#f5f3ff]",
  email: "text-[#0f172a] bg-[#f1f5f9]",
};

const ACTION_STYLE: Record<HomeTask["status"], string> = {
  done: "text-[#94a3b8]",
  overdue: "text-[#dc2626]",
  active: "text-[#16a34a]",
  pending: "text-[#0f172a]",
};

function TaskCheckbox({ status }: { status: HomeTask["status"] }) {
  if (status === "done") {
    return (
      <div className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] bg-[#2563EB]">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path
            d="M1.5 4.5l2 2L7.5 2"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (status === "overdue") {
    return <div className="h-[15px] w-[15px] shrink-0 rounded-[4px] border-[1.5px] border-[#fca5a5]" />;
  }
  return <div className="h-[15px] w-[15px] shrink-0 rounded-[4px] border-[1.5px] border-[#cbd5e1]" />;
}

function TaskTime({ task }: { task: HomeTask }) {
  if (task.status === "active") {
    return (
      <div className="flex items-center gap-1">
        <span
          className="inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-[#16a34a]"
          style={{ animation: "live-pulse 2s ease-in-out infinite" }}
        />
        <span className="text-[11px] font-bold text-[#16a34a]">{task.time}</span>
      </div>
    );
  }
  if (task.status === "overdue") {
    return <span className="text-[11px] font-bold text-[#dc2626]">{task.time}</span>;
  }
  if (task.status === "done") {
    return <span className="text-[11px] font-medium text-[#94a3b8]">{task.time}</span>;
  }
  return <span className="text-[11px] font-medium text-[#64748b]">{task.time}</span>;
}

function TaskRow({ task }: { task: HomeTask }) {
  return (
    <div
      className={cn(
        "grid items-center rounded-[6px] border-b border-[#f8fafc] px-1.5 py-2 last:border-b-0 hover:bg-[#fafafa]",
        task.status === "done" && "opacity-45",
      )}
      style={{ gridTemplateColumns: "20px 52px 70px 1fr auto", gap: "0 14px" }}
    >
      <TaskCheckbox status={task.status} />

      <TaskTime task={task} />

      <span
        className={cn(
          "rounded-[4px] px-2 py-0.5 text-center text-[10px] font-semibold",
          TYPE_STYLE[task.type],
        )}
      >
        {TYPE_LABELS[task.type]}
      </span>

      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        <span
          className={cn(
            "text-[13px] font-semibold",
            task.status === "done" ? "text-[#64748b] line-through" : "text-[#0f172a]",
          )}
        >
          {task.contactName}
        </span>
        <span
          className={cn(
            "text-[12px]",
            task.status === "done" ? "text-[#94a3b8]" : "text-[#64748b]",
          )}
        >
          · {task.company}
        </span>
        {task.context && (
          <span className="text-[12px] text-[#64748b]">· {task.context}</span>
        )}
        {task.signal && (
          <span className="inline-flex shrink-0 items-center gap-[3px] whitespace-nowrap rounded-[4px] bg-[#f0fdf4] px-1.5 py-px text-[10px] font-semibold text-[#16a34a]">
            <span
              className="inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-[#16a34a]"
              style={{ animation: "live-pulse 1.8s ease-in-out infinite" }}
            />
            Sinal ativo
          </span>
        )}
      </div>

      {task.status === "done" ? (
        <span className="whitespace-nowrap text-[11px] text-[#94a3b8]">Concluída</span>
      ) : (
        <Link
          href={task.actionHref}
          className={cn(
            "whitespace-nowrap text-[12px] font-bold transition-opacity hover:opacity-60",
            ACTION_STYLE[task.status],
          )}
        >
          {task.actionLabel}
        </Link>
      )}
    </div>
  );
}

export function HomeTaskManager({
  tasks,
  pendingCount,
  doneCount,
  isLoading,
  error,
}: {
  tasks: HomeTask[];
  pendingCount: number;
  doneCount: number;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#cbd5e1]">
          Tarefas do dia
        </span>
        {pendingCount > 0 && (
          <span className="rounded-[4px] bg-[#fffbeb] px-1.5 py-px text-[10px] font-bold text-[#f59e0b]">
            {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
          </span>
        )}
        {doneCount > 0 && (
          <span className="text-[10px] text-[#94a3b8]">· {doneCount} concluída{doneCount !== 1 ? "s" : ""}</span>
        )}
      </div>

      {error ? (
        <p className="text-[12px] text-[#dc2626]">{error}</p>
      ) : isLoading ? (
        <p className="text-[12px] text-[#94a3b8]">Carregando tarefas…</p>
      ) : tasks.length === 0 ? (
        <p className="text-[12px] text-[#94a3b8]">
          Nenhuma tarefa pendente — tarefas aparecem aqui quando um outcome &ldquo;Solicitou
          retorno&rdquo; é registrado no Dialer.
        </p>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
