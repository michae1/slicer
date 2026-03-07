## Why

Current data analysis tools require complex setup, multiple file uploads, or paid subscriptions. Users need a lightweight, browser-based solution to quickly explore and analyze their local data files without installation or configuration. DuckDB's in-browser capabilities enable this without requiring server infrastructure.

## What Changes

- **New Web Application**: Create a full-stack Data Explorer application with React frontend and DuckDB engine
- **File Processing**: Support drag-and-drop upload and processing of CSV, Parquet, and GeoJSON files
- **Interactive Analysis Interface**: Build dimensions/metrics panels with drag-and-drop functionality
- **Dynamic Query Interface**: Implement Group By and Filters zones with real-time data exploration
- **Results Display**: Create expandable, sortable table view for query results
- **Responsive UI**: Implement clean, minimal interface using Shadcn UI components

## Capabilities

### New Capabilities
- **data-file-upload**: Handle drag-and-drop file uploads with automatic format detection and schema inference
- **data-exploration-ui**: Create interactive panels for dimensions/metrics selection with drag-and-drop
- **duckdb-integration**: Integrate DuckDB WASM engine for client-side data processing and query execution
- **query-builder**: Build dynamic SQL queries based on user selections and display results
- **data-visualization**: Present results in interactive table format with grouping and filtering capabilities

### Modified Capabilities
- None - this is a new standalone application

## Impact

- **Frontend**: New React application with Shadcn UI component library
- **Data Engine**: Integration of DuckDB WebAssembly for client-side data processing
- **Deployment**: Vercel deployment configuration for static hosting
- **File Handling**: Browser-based file processing without server uploads
- **User Experience**: Streamlined data exploration workflow from file upload to insights