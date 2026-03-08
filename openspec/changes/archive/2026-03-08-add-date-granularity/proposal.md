## Why

Currently, the query builder only groups by raw date or timestamp values. To allow users to aggregate data over time periods (such as daily, weekly, monthly, or yearly trends), we need an easy way to apply date granularity to the `GROUP BY` clause. This is a common BI requirement that makes the tool significantly more useful for data analysis without complicating the drag-and-drop interface.

## What Changes

- Add a global "Granularity" dropdown (None, Day, Week, Month, Year) above the results table.
- When generating the SQL query, if a global granularity is selected, wrap any grouped date columns with the `DATE_TRUNC` function matching the selected granularity.
- The UI for selecting granularity will be simple and affect all date columns grouped in the current query.

## Capabilities

### New Capabilities
- `date-granularity`: The ability to aggregate date columns in the query builder by specific time granularities (Day, Week, Month, Year).

### Modified Capabilities
- `query-builder`: Modifying the SQL generator to respect date granularity when building `SELECT` and `GROUP BY` expressions for date columns.

## Impact

- `src/stores/dragDropStore.ts` to hold the `dateGranularity` state.
- `src/components/ResultsTable.tsx` (or an adjacent control area) to render the new dropdown.
- `src/services/queryBuilder.ts` to apply `DATE_TRUNC` to date columns in both the `SELECT` and `GROUP BY` logic.
