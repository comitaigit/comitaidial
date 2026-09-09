"use client";

import { useEffect, useState } from "react";

export function useCallTimer(startedAt: number | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    // Synchronously reset to 0 for each new timer start — the single
    // setElapsed(0) here is a deliberate reset, not cascading derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsed(0);
    const id = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startedAt]);

  return startedAt !== null ? elapsed : 0;
}
