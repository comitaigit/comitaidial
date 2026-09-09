"use client";

import { useCallback, useState } from "react";

// Native HTML5 drag-and-drop for manually reordering the "Pendente" rows of
// the Dialer queue — same interaction as reordering a playlist. Index 0
// (the row currently being worked) is excluded by the caller passing
// draggable/droppable only for index >= 1; this hook just tracks which row
// is being dragged and which row it's currently hovering over, and calls
// onMove with the final (from, to) once dropped.
export function useQueueDragAndDrop(onMove: (fromIndex: number, toIndex: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number, e: { preventDefault: () => void }) => {
    e.preventDefault(); // required by the browser to allow a drop here
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex !== null) onMove(dragIndex, index);
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, onMove],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return { dragIndex, overIndex, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}
