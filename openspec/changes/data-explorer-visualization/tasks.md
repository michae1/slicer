## 1. Setup & Foundations

- [x] 1.1 Add `recharts` dependency to `package.json`
- [x] 1.2 Create `src/stores/chartStore.ts` for visualization settings (type, axes) with persistence
- [x] 1.3 Create `src/stores/layoutStore.ts` for panel dimensions with persistence

## 2. Shared Registry & Layout Components

- [x] 2.1 Create `src/components/ResizablePanel.tsx` with PointerEvent-based resizing and collapse logic
- [x] 2.2 Create `src/components/Splitter.tsx` for the draggable divider
- [x] 2.3 Refactor `App.tsx` results section to use the new split layout

## 3. Visualization Panel Implementation

- [x] 3.1 Create `src/components/ChartPanel.tsx` as the main visualization container
- [x] 3.2 Implement `src/components/ChartTypeSwitcher.tsx` for manual selection
- [x] 3.3 Implement `src/components/AxisSelector.tsx` for mapping dimensions/measures to X/Y
- [x] 3.4 Create `src/components/charts/AdaptiveChart.tsx` that renders Bar, Line, or Pie using Recharts

## 4. Business Logic & Validation

- [x] 4.1 Implement `getAutoChartConfig` utility to suggest chart type and axes based on columns and types
- [x] 4.2 Implement query result data mapping and sampling (max 1000 rows) for chart display
- [x] 4.3 Add smart validation logic to display "Table only" message for invalid configurations

## 5. Polish & Testing

- [x] 5.1 Ensure smooth transitions when collapsing/expanding panels
- [x] 5.2 Verify layout persistence after page reloads
- [x] 5.3 Fine-tune chart aesthetics (colors, padding, tooltips) to match project style
- [x] 5.4 Implement Top N limiting for charts to handle large datasets
- [x] 5.5 Synchronize table sorting with chart data using global state
