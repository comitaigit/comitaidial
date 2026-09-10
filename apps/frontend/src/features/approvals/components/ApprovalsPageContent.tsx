"use client";

import { ActionApprovalsCard } from "@/features/approvals/components/ActionApprovalsCard";
import { ProposalApprovalsCard } from "@/features/approvals/components/ProposalApprovalsCard";
import { LinkedInActionsCard } from "@/features/approvals/components/LinkedInActionsCard";
import { useApprovalsPage } from "@/features/approvals/hooks/useApprovalsPage";

export function ApprovalsPageContent() {
  const {
    actions,
    proposals,
    linkedinActions,
    isLoading,
    error,
    busyId,
    approveAction,
    rejectAction,
    approveProposal,
    rejectProposal,
    completeLinkedInAction,
    skipLinkedInAction,
  } = useApprovalsPage();

  if (isLoading) return <p className="text-sm text-muted">Carregando…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;

  return (
    <div className="grid gap-3.5 lg:grid-cols-2">
      <ActionApprovalsCard
        actions={actions}
        busyId={busyId}
        onApprove={approveAction}
        onReject={rejectAction}
      />
      <ProposalApprovalsCard
        proposals={proposals}
        busyId={busyId}
        onApprove={approveProposal}
        onReject={rejectProposal}
      />
      <LinkedInActionsCard
        actions={linkedinActions}
        busyId={busyId}
        onComplete={completeLinkedInAction}
        onSkip={skipLinkedInAction}
      />
    </div>
  );
}
