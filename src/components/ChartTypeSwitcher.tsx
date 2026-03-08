import React from 'react';
import { useChartStore, ChartType } from '@/stores/chartStore';
import { cn } from '@/utils/cn';

const TYPES: { id: ChartType; icon: string; label: string }[] = [
  { id: 'bar', icon: '📊', label: 'Bar' },
  { id: 'line', icon: '📈', label: 'Line' },
  { id: 'pie', icon: '🥧', label: 'Pie' },
];

export const ChartTypeSwitcher: React.FC = () => {
  const { chartType, setChartType } = useChartStore();

  return (
    <div className="flex bg-slate-200/50 p-1 rounded-lg">
      {TYPES.map((type) => (
        <button
          key={type.id}
          data-testid={`chart-type-${type.id}`}
          onClick={() => setChartType(type.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            chartType === type.id 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
          )}
        >
          <span>{type.icon}</span>
          <span>{type.label}</span>
        </button>
      ))}
    </div>
  );
};
