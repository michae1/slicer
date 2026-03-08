import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChartType = 'bar' | 'line' | 'pie';

interface ChartState {
  chartType: ChartType;
  xAxis: string | null;
  yAxis: string[];
  colorBy: string | null;
  isEnabled: boolean;
  topN: number | null;

  // Actions
  setChartType: (type: ChartType) => void;
  setXAxis: (columnName: string | null) => void;
  setYAxis: (columnNames: string[]) => void;
  toggleYAxis: (columnName: string) => void;
  setColorBy: (columnName: string | null) => void;
  setIsEnabled: (enabled: boolean) => void;
  setTopN: (n: number | null) => void;
  resetChart: () => void;
}

export const useChartStore = create<ChartState>()(
  persist(
    (set) => ({
      chartType: 'bar',
      xAxis: null,
      yAxis: [],
      colorBy: null,
      isEnabled: true,
      topN: 10, // Default to top 10

      setChartType: (chartType) => set({ chartType }),
      setXAxis: (xAxis) => set({ xAxis }),
      setYAxis: (yAxis) => set({ yAxis }),
      toggleYAxis: (columnName) => set((state) => {
        const exists = state.yAxis.includes(columnName);
        if (exists) {
          return { yAxis: state.yAxis.filter(name => name !== columnName) };
        } else {
          return { yAxis: [...state.yAxis, columnName] };
        }
      }),
      setColorBy: (colorBy) => set({ colorBy }),
      setIsEnabled: (isEnabled) => set({ isEnabled }),
      setTopN: (topN) => set({ topN }),
      resetChart: () => set({
        chartType: 'bar',
        xAxis: null,
        yAxis: [],
        colorBy: null,
        topN: 10,
      }),
    }),
    {
      name: 'chart-settings',
    }
  )
);
