import React from 'react';
import { cn } from '@/utils/cn'; // Assuming this exists or I'll create it if needed
import { useLayoutStore } from '@/stores/layoutStore';

interface ResizablePanelProps {
  children: React.ReactNode;
  className?: string;
  id: string; // Identifier for the panel
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({ children, className, id }) => {
  const { chartWidth, isChartCollapsed } = useLayoutStore();

  // For simplicity, we'll assume the chart is always the first panel (left/top)
  const isChart = id === 'chart-panel';
  
  const style: React.CSSProperties = isChart ? {
    width: isChartCollapsed ? '0px' : `${chartWidth}%`,
    minWidth: isChartCollapsed ? '0px' : '0px',
    overflow: 'hidden',
    transition: 'width 0.2s ease-in-out',
  } : {
    flex: 1,
    minWidth: '0px',
  };

  return (
    <div 
      id={id}
      className={cn(
        "h-full relative",
        isChart && "bg-slate-50 border-r border-gray-200",
        !isChart && "bg-white",
        className
      )}
      style={style}
    >
      <div className={cn(
        "h-full w-full",
        isChart && isChartCollapsed && "invisible opacity-0"
      )}>
        {children}
      </div>
    </div>
  );
};
