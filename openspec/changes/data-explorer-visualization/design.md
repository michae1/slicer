## Context

The current Data Explorer only displays results in a tabular format. Users want to visualize data using charts alongside the table to quickly identify trends. This requires a new resizable layout in the results area and a dynamic charting component that adapts to query result schemas.

## Goals / Non-Goals

**Goals:**
- Provide simultaneous view of chart and table in the results area.
- Implement a draggable vertical splitter between chart and table.
- Support automatic and manual chart type selection (Bar, Line, Pie).
- Persist panel proportions and chart settings in LocalStorage.
- Ensure the chart remains responsive within its resizable container.

**Non-Goals:**
- Complex multi-series chart configurations beyond basic X/Y mapping.
- Advanced chart interactions like zooming or detailed tooltips (basic tooltips only).
- Multiple charts in the same view (single chart per query).

## Decisions

**1. Charting Library**
- **Choice**: `recharts`
- **Rationale**: Recharts is built for React and provides a declarative API that fits well with the project's architecture. It handles responsive resizing automatically when wrapped correctly.
- **Alternatives Considered**: Chart.js (requires canvas/DOM manipulation), D3 (too low-level for this phase), Victory (heavier bundle).

**2. Layout Resizing Implementation**
- **Choice**: Custom React-based splitter using `PointerEvent` and CSS Flexbox.
- **Rationale**: Minimal external overhead and full control over the "collapse < 100px" behavior. Using `flex-basis` and `overflow-hidden` for the panels.
- **Alternatives Considered**: `react-resizable-panels` (adds dependency, but more robust for complex layouts).

**3. State Management**
- **Choice**: New `useChartStore` and `useLayoutStore` using Zustand with `persist` middleware.
- **Rationale**: Consistent with existing state management (`useDragDropStore`). Persistence comes out of the box with Zustand.
- **Alternatives Considered**: Local component state (won't persist), Context API (re-renders everything).

**4. Data Handling**
- **Choice**: Client-side sampling if rows > 1000.
- **Rationale**: Rendering 10k+ points in SVG can lag the browser. Sampling preserves the "shape" of the data for visualization.
- **Alternatives Considered**: Aggregating in DuckDB (ideal, but requires more complex query generation logic).

## Risks / Trade-offs

**[SVG Rendering Performance]** → **Mitigation**: Implement data sampling/truncation to first 1000 rows.
**[Layout Shift on Initial Load]** → **Mitigation**: Ensure default proportions (60/40) are applied via CSS before JS hydration to avoid flickering.
**[Pie Chart with many Categories]** → **Mitigation**: Limit Pie chart to top 10 categories + "Other" if necessary (or just truncate).
