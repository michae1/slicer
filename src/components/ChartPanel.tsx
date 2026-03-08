import React from 'react';
import { useChartStore } from '@/stores/chartStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { ChartTypeSwitcher } from './ChartTypeSwitcher';
import { AxisSelector } from './AxisSelector';
import { AdaptiveChart } from './charts/AdaptiveChart';
import type { QueryResult } from '@/utils/database';
import { getAutoChartConfig } from '@/utils/chartHelpers';
import { useDragDropStore } from '@/stores/dragDropStore';
import { cn } from '@/utils/cn';

interface ChartPanelProps {
  result: QueryResult;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ result }) => {
  const { isChartCollapsed, setChartCollapsed } = useLayoutStore();
  const { isEnabled, xAxis, yAxis, setXAxis, setYAxis, setChartType } = useChartStore();
  const { groupByColumns, measureColumns } = useDragDropStore();

  // Auto-config logic
  const prevMeasuresRef = React.useRef<string[]>([]);
  
  React.useEffect(() => {
    const measureNames = measureColumns.map(m => m.name);
    const newMeasures = measureNames.filter(m => !prevMeasuresRef.current.includes(m));
    
    // 1. If no X-axis is set, but we have a dimension, set it
    if (!xAxis && groupByColumns.length > 0) {
      setXAxis(groupByColumns[0].name);
      
      // Auto-set chart type for dates
      const lowerType = groupByColumns[0].type.toLowerCase();
      if (lowerType.includes('date') || lowerType.includes('time')) {
        setChartType('line');
      }
    }

    // 2. If new measures are added, activate them immediately
    if (newMeasures.length > 0) {
      const updatedYAxis = Array.from(new Set([...yAxis, ...newMeasures]));
      setYAxis(updatedYAxis);
      
      // Initial defaults
      if (yAxis.length === 0 && groupByColumns.length > 0) {
         const config = getAutoChartConfig(groupByColumns, measureColumns);
         setChartType(config.type);
      }
    }

    // 3. Remove orphaned measures
    const validMeasures = yAxis.filter(m => measureNames.includes(m));
    if (validMeasures.length !== yAxis.length) {
      setYAxis(validMeasures);
    }

    prevMeasuresRef.current = measureNames;
  }, [groupByColumns, measureColumns, xAxis, yAxis, setXAxis, setYAxis, setChartType]);

  if (isChartCollapsed) {
    return (
      <div 
        className="h-full w-8 bg-slate-50 border-r border-gray-200 flex flex-col items-center py-6 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setChartCollapsed(false)}
        title="Open Visualization Panel"
      >
        <div className="rotate-90 text-[10px] font-black tracking-widest text-slate-400 whitespace-nowrap flex items-center gap-2">
          VISUALIZATION 📊
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with Switcher */}
      <div className="flex flex-col border-b bg-slate-50/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <span>📊</span> Visualization
          </h3>
          <div className="flex items-center gap-3">
            <ChartTypeSwitcher />
            <button 
              onClick={() => setChartCollapsed(true)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              title="Collapse Panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Controls Section (Axis Selectors) */}
        <div className="px-5 pb-5 pt-2 border-t border-slate-100">
           <AxisSelector />
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 min-h-0 relative p-6 bg-slate-50/20 overflow-hidden">
        {!isEnabled ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
            <span className="text-4xl grayscale">❌</span>
            <p className="text-xs font-bold tracking-tight text-slate-500 uppercase">Visualization Disabled</p>
          </div>
        ) : (
          <div className="h-full w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
             <AdaptiveChart result={result} />
          </div>
        )}
      </div>
    </div>
  );
};
