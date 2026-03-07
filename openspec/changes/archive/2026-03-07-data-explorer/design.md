## Context

Building a lightweight, browser-based data analysis tool that enables users to upload local files (CSV, Parquet, GeoJSON) and perform interactive data exploration without server infrastructure. The application must leverage DuckDB's WebAssembly capabilities for client-side data processing while providing an intuitive drag-and-drop interface similar to simplified data analytics platforms.

## Goals / Non-Goals

**Goals:**
- Implement browser-based data processing using DuckDB WASM
- Create intuitive drag-and-drop file upload and data exploration interface
- Build stateless React architecture with Shadcn UI components
- Support real-time query building with Group By and Filters functionality
- Deliver clean, minimal UI inspired by Metabase but lightweight
- Enable Vercel deployment with static hosting

**Non-Goals:**
- User authentication or multi-user support
- Data persistence or server-side storage
- Advanced visualization beyond tables (charts, graphs)
- Real-time collaboration features
- Large dataset processing (>100MB files)
- Database connectivity or external data sources

## Decisions

**1. React State Management**
- **Choice**: Stateless React components with React Query for server state and Zustand for UI state
- **Rationale**: Stateless architecture provides better testability and predictability. React Query handles data fetching/caching, while Zustand manages lightweight UI state for drag-and-drop operations
- **Alternatives Considered**: Redux (too complex), Context API (unnecessary re-renders), Component state (too fragmented)

**2. DuckDB Integration Strategy**
- **Choice**: @duckdb/duckdb-wasm for browser-based database engine
- **Rationale**: Enables client-side SQL queries without server infrastructure. WASM provides performance comparable to native applications
- **Alternatives Considered**: SQL.js (smaller but less feature-complete), Web Workers + WebSQL (deprecated)

**3. Drag-and-Drop Implementation**
- **Choice**: @dnd-kit/core with custom sensors for mouse/touch support
- **Rationale**: Modern, accessible library with TypeScript support and good performance. More flexible than HTML5 drag-and-drop API
- **Alternatives Considered**: react-beautiful-dnd (deprecated), @dnd-kit/sortable (overkill for simple drag)

**4. File Processing Architecture**
- **Choice**: Parse files client-side, convert to DuckDB tables via SQL COPY commands
- **Rationale**: Eliminates need for backend file processing. DuckDB handles format detection and schema inference automatically
- **Alternatives Considered**: Papa Parse + manual processing (duplicate work), File System Access API (browser compatibility)

**5. Component Structure**
- **Choice**: Compound component pattern with composition over inheritance
- **Rationale**: Provides flexibility for different layouts while maintaining consistent API. Follows Shadcn UI patterns
- **Alternatives Considered**: Higher-order components (too complex), Render props (verbose)

**6. Styling Strategy**
- **Choice**: Tailwind CSS with Shadcn UI component library
- **Rationale**: Rapid development with consistent design system. Shadcn provides accessible components with minimal footprint
- **Alternatives Considered**: CSS Modules (too low-level), Styled Components (runtime overhead)

## Risks / Trade-offs

**[File Size Limitations]** → **Mitigation**: Implement progressive loading and data sampling for files >10MB. Provide user feedback on processing status.

**[Browser Memory Constraints]** → **Mitigation**: Use columnar data storage in DuckDB for efficient memory usage. Implement data pagination for large result sets.

**[DuckDB WASM Bundle Size]** → **Mitigation**: Lazy load DuckDB engine after initial file upload. Use dynamic imports to minimize initial bundle size.

**[Cross-browser Compatibility]** → **Mitigation**: Test on Chrome, Firefox, Safari, Edge. Fallback to FileReader API for older browsers. Use polyfills for modern features.

**[User Experience Complexity]** → **Mitigation**: Progressive disclosure - start with simple interface, add advanced features incrementally. Provide tooltips and onboarding.

**[Performance with Large Datasets]** → **Mitigation**: Implement virtual scrolling for table display, use DuckDB's query optimization, provide data sampling options.

## Migration Plan

**Phase 1: Foundation Setup**
1. Initialize React + TypeScript + Vite project
2. Configure Tailwind CSS and Shadcn UI
3. Set up project structure and routing
4. Implement basic layout components

**Phase 2: Core Functionality**
1. Integrate DuckDB WASM engine
2. Implement file upload and processing
3. Create data schema inference system
4. Build query builder foundation

**Phase 3: User Interface**
1. Design and implement main layout panels
2. Create drag-and-drop interactions
3. Build filter and group-by functionality
4. Implement results table display

**Phase 4: Polish & Deployment**
1. Add error handling and loading states
2. Implement responsive design
3. Optimize performance and bundle size
4. Configure Vercel deployment

**Rollback Strategy**: Maintain Git tags for each phase to enable quick rollback if issues arise during deployment.

## Open Questions

**Q1: Should we support streaming large files or require full file loading?**
Current thinking: Support files up to 50MB with full loading, provide data sampling for larger files.

**Q2: How should we handle different data types and schema inference?**
Current thinking: Let DuckDB auto-detect types, with manual override option in UI for ambiguous cases.

**Q3: What level of SQL query customization should we expose?**
Current thinking: Hide SQL completely, provide visual query builder only. Advanced users get raw query view as optional feature.

**Q4: Should we implement data export functionality?**
Current thinking: Yes, export filtered/aggregated results as CSV. Consider Parquet export for larger datasets.

**Q5: How to handle time zone and locale considerations?**
Current thinking: Use browser locale for date/time display, with explicit timezone selection in query results.