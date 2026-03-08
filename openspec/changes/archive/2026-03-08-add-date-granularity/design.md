## Context

The current system allows grouping by any column, but grouping by date columns often results in too many groups (e.g., one group per second or millisecond). Users need a way to aggregate these events into meaningful time buckets like days or months.

## Goals / Non-Goals

**Goals:**
- Provide a global selector for date granularity (None, Day, Week, Month, Year).
- Automatically detect date columns in the "Group By" zone.
- Update the SQL query to use `DATE_TRUNC` for these columns.
- Ensure the UI remains simple and doesn't require complex per-field configuration for now.

**Non-Goals:**
- Custom date ranges or fiscal years.
- Different granularities for different columns in the same query.
- Timezone conversions (will use the data's native TZ or UTC).

## Decisions

### 1. Global State in `dragDropStore`
We will add `dateGranularity` to the `useDragDropStore`. This allows the `queryBuilder` to easily access the setting without passing it through many components.
- **Rationale**: The granularity is a property of the current analysis view, similar to filters and dimensions.

### 2. SQL Implementation via `DATE_TRUNC`
We will use DuckDB's `DATE_TRUNC()` function. Since some date columns might be stored as Unix timestamps (numbers), we will ensure they are cast to `TIMESTAMP` before truncation.
- **Example**: `DATE_TRUNC('month', TO_TIMESTAMP("my_date_column" / 1000))`

### 3. UI Placement
The selector will be placed in the `ResultsTable` header area or a dedicated "Query Settings" bar above the results. This keeps it close to the data it affects.

## Risks / Trade-offs

- **[Risk]** Data Type Detection → If a column doesn't match our "date-like" naming patterns or isn't explicitly typed as DATE/TIMESTAMP by DuckDB, it won't be truncated.
- **[Mitigation]** We use a combination of DuckDB schema types and common name patterns (`date`, `time`, `_at`).
- **[Trade-off]** Global vs Per-Column → A global setting is less flexible but much easier to use. Most analysis sessions focus on a single time dimension anyway.
