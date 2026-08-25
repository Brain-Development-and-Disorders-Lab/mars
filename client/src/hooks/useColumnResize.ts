import { useCallback, useRef } from "react";

type ResizeState = {
  columnId: string;
  startX: number;
  startWidth: number;
  minWidth: number;
  otherFixedWidth: number;
  reserveWidth: number;
};

/**
 * Drag-to-resize for a row of fixed-width columns followed by one flexible column that absorbs
 * remaining space. Callers compute `otherFixedWidth` and `reserveWidth` at drag-start, since
 * only they know the current column layout.
 */
export const useColumnResize = (params: {
  containerRef: React.RefObject<HTMLElement | null>;
  onResize: (columnId: string, width: number) => void;
}) => {
  const { containerRef, onResize } = params;
  const resizeRef = useRef<ResizeState | null>(null);

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const { columnId, startX, startWidth, minWidth, otherFixedWidth, reserveWidth } = resizeRef.current;
      const containerWidth = containerRef.current?.offsetWidth ?? Infinity;
      const maxWidth = containerWidth - otherFixedWidth - reserveWidth;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + (event.clientX - startX)));
      onResize(columnId, newWidth);
    },
    [containerRef, onResize],
  );

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback(
    (state: Omit<ResizeState, "startX">, event: React.MouseEvent) => {
      event.preventDefault();
      resizeRef.current = { ...state, startX: event.clientX };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
    },
    [handleResizeMove, handleResizeEnd],
  );

  return { handleResizeStart };
};
