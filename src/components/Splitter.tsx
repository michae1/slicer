import React, { useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useLayoutStore } from '@/stores/layoutStore';

export const Splitter: React.FC = () => {
  const { setChartWidth, isChartCollapsed, setChartCollapsed } = useLayoutStore();
  const splitterRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const parent = splitterRef.current?.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const parentWidth = parentRect.width;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const offsetX = moveEvent.clientX - parentRect.left;
      const percentage = (offsetX / parentWidth) * 100;

      // Snap to collapse if < 100px (approximate)
      if (offsetX < 100) {
        setChartWidth(0);
        setChartCollapsed(true);
      } else {
        setChartWidth(percentage);
        setChartCollapsed(false);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    document.body.style.cursor = 'col-resize';
  }, [setChartWidth, setChartCollapsed]);

  return (
    <div
      ref={splitterRef}
      onPointerDown={onPointerDown}
      data-testid="layout-splitter"
      className={cn(
        "w-1 group relative z-50 h-screen cursor-col-resize select-none bg-gray-200 transition-colors hover:bg-blue-400 active:bg-blue-500",
        isChartCollapsed && "hover:bg-blue-300 w-2"
      )}
    >
      {/* Draggable indicator - Vertical dots */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
        <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-blue-600 shadow-sm" />
        <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-blue-600 shadow-sm" />
        <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-blue-600 shadow-sm" />
      </div>
    </div>
  );
};
