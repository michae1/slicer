import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  chartWidth: number; // Percentage (0 to 100)
  isChartCollapsed: boolean;

  // Actions
  setChartWidth: (percentage: number) => void;
  setChartCollapsed: (collapsed: boolean) => void;
  toggleChartCollapse: () => void;
  resetLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      chartWidth: 60, // Default to 60% width
      isChartCollapsed: false,

      setChartWidth: (chartWidth) => set({
        chartWidth: Math.min(Math.max(chartWidth, 0), 100),
      }),
      setChartCollapsed: (isChartCollapsed) => set({ isChartCollapsed }),
      toggleChartCollapse: () => set((state) => ({ isChartCollapsed: !state.isChartCollapsed })),
      resetLayout: () => set({
        chartWidth: 60,
        isChartCollapsed: false,
      }),
    }),
    {
      name: 'layout-settings',
    }
  )
);
