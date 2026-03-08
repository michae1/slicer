## 1. Setup & Foundations

- [ ] 1.1 Add `recharts` dependency to `package.json`
- [ ] 1.2 Create `src/stores/chartStore.ts` for visualization settings (type, axes) with persistence
- [ ] 1.3 Create `src/stores/layoutStore.ts` for panel dimensions with persistence

## 2. Shared Registry & Layout Components

- [ ] 2.1 Create `src/components/ResizablePanel.tsx` with PointerEvent-based resizing and collapse logic
- [ ] 2.2 Create `src/components/Splitter.tsx` for the draggable divider
- [ ] 2.3 Refactor `App.tsx` results section to use the new split layout

## 3. Visualization Panel Implementation

- [ ] 3.1 Create `src/components/ChartPanel.tsx` as the main visualization container
- [ ] 3.2 Implement `src/components/ChartTypeSwitcher.tsx` for manual selection
- [ ] 3.3 Implement `src/components/AxisSelector.tsx` for mapping dimensions/measures to X/Y
- [ ] 3.4 Create `src/components/charts/AdaptiveChart.tsx` that renders Bar, Line, or Pie using Recharts

## 4. Business Logic & Validation

- [ ] 4.1 Implement `getAutoChartConfig` utility to suggest chart type and axes based on columns and types
- [ ] 4.2 Implement query result data mapping and sampling (max 1000 rows) for chart display
- [ ] 4.3 Add smart validation logic to display "Table only" message for invalid configurations

## 5. Polish & Testing

- [ ] 5.1 Ensure smooth transitions when collapsing/expanding panels
- [ ] 5.2 Verify layout persistence after page reloads
- [ ] 5.3 Fine-tune chart aesthetics (colors, padding, tooltips) to match project style
