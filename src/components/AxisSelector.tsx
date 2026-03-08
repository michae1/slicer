import React from 'react';
import { useChartStore } from '@/stores/chartStore';
import { useDragDropStore } from '@/stores/dragDropStore';
import { cn } from '@/utils/cn';

export const AxisSelector: React.FC = () => {
  const { xAxis, yAxis, setXAxis, toggleYAxis, topN, setTopN } = useChartStore();
  const { groupByColumns, measureColumns } = useDragDropStore();

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* X-AXIS */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Dimension (X-Axis)
        </label>
        <div className="flex flex-wrap gap-2 min-h-8">
          {groupByColumns.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1 pt-1">No dimensions selected</p>
          ) : (
            groupByColumns.map((col) => (
              <button
                key={col.name}
                onClick={() => setXAxis(xAxis === col.name ? null : col.name)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold border-2 transition-all",
                  xAxis === col.name 
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500"
                )}
              >
                {col.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Y-AXIS (Multi-select) */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Measures (Y-Axis)
        </label>
        <div className="flex flex-wrap gap-2 min-h-8">
          {measureColumns.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1 pt-1">No measures selected</p>
          ) : (
            measureColumns.map((col) => {
              const isActive = yAxis.includes(col.name);
              return (
                <button
                  key={col.name}
                  onClick={() => toggleYAxis(col.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold border-2 transition-all",
                    isActive 
                      ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-500"
                  )}
                >
                  {col.name} ({col.aggregation})
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* TOP N LIMITING */}
      <div className="space-y-2 border-t border-slate-100 pt-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Limit (Top N)
        </label>
        <div className="flex items-center gap-3 px-1">
          <input
            type="number"
            min="1"
            max="1000"
            value={topN || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
              setTopN(val);
            }}
            placeholder="No limit"
            className="w-20 px-3 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <span className="text-[10px] text-slate-400 font-medium">
            Limits rows by current sort
          </span>
        </div>
      </div>
    </div>
  );
};
