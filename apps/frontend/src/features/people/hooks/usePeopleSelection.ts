"use client";

import { useState } from "react";

export function usePeopleSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids));
  }

  function clear() {
    setSelectedIds(new Set());
  }

  return { selectedIds, toggle, selectAll, clear };
}
