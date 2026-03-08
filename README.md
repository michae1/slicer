# Data Explorer

A client‑side simplified data explorer built with React and DuckDB WASM. Upload CSV (and eventually Parquet/GeoJSON) and query your data in the browser.

**Live demo:** https://slicer-ckzv.vercel.app/

---

## Features

- CSV file upload and parsing
- Client‑side SQL querying using DuckDB WASM
- Drag‑and‑drop query builder (dimensions → Group By/Filters)
- Interactive results table with sorting, paging and formatting
- No backend – all work happens in browser memory

## Status

✅ Core CSV upload + schema inference works

✅ Drag‑drop query builder and results table are functional

🚧 Parquet/GeoJSON support, charts and exports still in progress

⚠️ Can struggle with very large (>10 MB) files due to browser memory

## Tech stack

React + Vite, DuckDB‑WASM, @dnd‑kit for drag‑drop, Zustand for state, Tailwind for styling. Playwright powers the E2E tests.

## Drag & Drop Query Builder

The Data Explorer features an intuitive drag-and-drop interface for building SQL queries without writing SQL code directly.

### How to Use

1. **Upload a CSV file** using the file upload area
2. **Browse dimensions and metrics** in the left sidebar
3. **Drag dimensions** to either:
   - **Group By zone**: For aggregating data by specific columns
   - **Filters zone**: For filtering data by specific values
4. **Results update automatically** as you add or remove dimensions

### Drag & Drop Features

#### Source: Sidebar

- **Dimensions Tab**: String/categorical fields (green badges)
- **Metrics Tab**: Numeric fields (blue/purple badges)
- **Search**: Filter columns by name
- **Draggable**: Every column is draggable with visual feedback

#### Target: Group By Zone

- **Visual feedback**: Zone highlights when draggable items are hovering
- **Duplicate prevention**: Cannot add the same column twice
- **Reordering**: Drag chips within the zone to change order
- **Clear all**: Remove all dimensions at once

#### Target: Filters Zone

- **Visual feedback**: Zone highlights when draggable items are hovering
- **Duplicate prevention**: Cannot add the same column twice
- **Value selection**: After dropping, select specific values to filter by
- **Multiple filters**: Add multiple dimension filters

### Technical Implementation

The drag-and-drop functionality uses `@dnd-kit/core` and `@dnd-kit/sortable`:

- **DraggableSidebar**: Columns in sidebar are draggable with proper data attributes
- **Drop Zones**: GroupByZone and FiltersZone handle drop events
- **State Management**: Zustand store (`dragDropStore.ts`) manages drag state
- **Visual Feedback**: DragOverlay shows what's being dragged during operations

### Code Structure

```
src/
├── components/
│   ├── layout/Sidebar.tsx    # Draggable columns
│   ├── GroupByZone.tsx       # Drop zone with reorderable chips
│   └── FiltersZone.tsx       # Drop zone with filter controls
├── stores/
│   └── dragDropStore.ts      # State management for drag & drop
└── tests/
    └── drag-drop.spec.ts     # E2E tests for drag & drop functionality
```

## File Structure

### Getting started

```bash
npm install
npm run dev       # start local server
npm run build     # production bundle
npm run lint      # run eslint
npm run test:e2e  # playwrite end‑to‑end tests
```

Local app runs at http://localhost:5173 by default.

## File Structure

```
src/
├── components/          # React components
│   ├── FileUpload.tsx  # File upload interface
│   ├── ResultsTable.tsx # Data table display
│   ├── GroupByZone.tsx # Query builder
│   └── FiltersZone.tsx # Data filtering
├── services/           # Business logic
│   ├── duckdb.ts      # DuckDB WASM initialization
│   └── fileProcessing.ts # CSV parsing and processing
├── utils/             # Utilities
│   ├── database.ts    # Database operations
│   ├── validation.ts  # Input validation
│   └── memory.ts      # Memory management
├── stores/            # State management
│   ├── dragDropStore.ts
│   └── queryStore.ts
├── hooks/             # Custom React hooks
└── types/             # TypeScript definitions
```

## CSV Processing Implementation

The application implements a robust CSV parser that handles:

- **Quoted Values**: Properly processes commas, quotes, and newlines within quoted fields
- **Type Inference**: Automatically detects data types from sample values
- **Schema Creation**: Generates appropriate SQL column types
- **Data Validation**: Validates file format, size, and structure

### Type Inference Logic

```typescript
// Simple type detection
- Empty/null values → VARCHAR
- All numeric values → INTEGER or DOUBLE
- All valid dates → DATE
- Otherwise → VARCHAR
```

## Testing Strategy

### Smoke Test

- **File**: `tests/smoke.spec.ts`
- **Coverage**: Full upload → processing → results flow
- **Timeout**: 30 seconds for file processing

### Test Data

- **Location**: `public/test-data.csv`
- **Content**: 10 rows with mixed data types (name, age, city, department, salary)

## Recent Changes

### Fixed Issues

1. **DuckDB WASM Blob URL Issue** (Mar 2026)
   - Problem: `IO Error: No files found that match blob:...`
   - Solution: Replaced blob URLs with manual CSV parsing
   - Files: `src/services/fileProcessing.ts`, `src/utils/database.ts`

2. **FileUpload Function Order** (Mar 2026)
   - Problem: `handleFileSelect accessed before declaration`
   - Solution: Reordered function declarations in FileUpload.tsx
   - Files: `src/components/FileUpload.tsx`

3. **TypeScript Build Errors** (Mar 2026)
   - Problem: Type conflicts with DuckDB connection
   - Solution: Updated type annotations and removed unused methods
   - Files: Multiple files updated for build compatibility

4. **Test Timeout Issues** (Mar 2026)
   - Problem: Processing stuck in progress state
   - Solution: Improved file processing pipeline and error handling
   - Files: `tests/smoke.spec.ts` updated

5. **Drag and Drop Functionality** (Mar 2026)
   - Problem: Dimensions were displayed in sidebar but not draggable to query builder zones
   - Solution: Implemented full drag and drop functionality using @dnd-kit
   - Changes: Made sidebar columns draggable, connected to GroupByZone and FiltersZone
   - Files: `src/components/layout/Sidebar.tsx`, `src/components/GroupByZone.tsx`, `src/components/FiltersZone.tsx`
   - Tests: Added `tests/drag-drop.spec.ts` for end-to-end testing
   - Documentation: Updated README with drag & drop usage guide

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

**Requirements**: WebAssembly support, ES2020+ JavaScript

## Performance Considerations

- **File Size Limit**: 100MB maximum (configurable)
- **Memory Usage**: All data stored in browser memory
- **Processing Time**: Typically 1-5 seconds for 10,000 row CSV files
- **Bundle Size**: ~500KB main bundle (includes DuckDB WASM)

## Security

- **Client-Side Only**: No data leaves the browser
- **Input Validation**: All files validated before processing
- **SQL Injection Protection**: Query validation and sanitization
- **Content Security Policy**: Recommended for production deployment

## Contributing

When contributing, please:

1. Update tests for new features
2. Run `npm run lint` before committing
3. Update this documentation for significant changes
4. Test with both small and large CSV files

## License

This project is part of the slicer workspace.
