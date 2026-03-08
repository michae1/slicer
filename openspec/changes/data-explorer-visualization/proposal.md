## Why

Users currently can only see SQL results in a table format, making it difficult to quickly identify trends or patterns. Adding a built-in chart visualization directly in the data explorer will provide immediate visual feedback and improve the utility of the explorer for data discovery.

## What Changes

- **Add Chart Panel**: A new collapsible/resizable panel to the left of (or above) the results table.
- **Dynamic Visualization**: Automatic generation of Bar, Line, or Pie charts based on the current dimension and measure configuration.
- **Interactive Configuration**: Selectors to choose which dimensions or measures serve as X and Y axes.
- **Layout Management**: A draggable splitter between the chart and table with persistence of sizes in LocalStorage. **BREAKING**: Changes the main results view from a single table to a split view.
- **Smart Validation**: Logic to determine if the current query configuration is valid for charting, falling back to a "Table only" view if not.

## Capabilities

### New Capabilities
- `chart-visualization`: Handles mapping SQL results (dimensions and measures) to chart configurations and rendering them using a charting library.
- `resizable-explorer-layout`: Implements the draggable divider between chart and table panels with persistence and collapse behavior.

### Modified Capabilities
- None

## Impact

- **UI Components**: `ResultsTable.tsx` will be wrapped or modified to fit into the new split layout.
- **State Management**: New stores or state slices to manage chart configuration (type, axes) and panel dimensions.
- **Dependencies**: May require a charting library (e.g., Recharts, Chart.js) if not already present.
- **Storage**: LocalStorage will be used to store panel widths/heights.
