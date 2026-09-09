"use client";

import { Button } from "@/components/ui/Button";
import { usePeopleBulkActions } from "@/features/people/hooks/usePeopleBulkActions";

export function BulkActionsBar({
  selectedIds,
  onDone,
}: {
  selectedIds: string[];
  onDone: () => void;
}) {
  const { openAddToCadenceModal } = usePeopleBulkActions(selectedIds, onDone);

  return (
    <div className="mb-3 flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2">
      <span className="text-xs text-muted">
        {selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}
      </span>
      <Button variant="primary" size="small" onClick={openAddToCadenceModal}>
        Adicionar à cadência
      </Button>
    </div>
  );
}
