# Date Granularity

## Requirements

### Requirement: Date Granularity Selector
The system SHALL provide a global dropdown to select date granularity (None, Hour, Day, Week, Month, Year) above the results table.

#### Scenario: User selects a granularity
- **WHEN** user chooses "Month" from the granularity dropdown
- **THEN** any grouped date columns SHALL be formatted and aggregated by month

### Requirement: Granularity-Aware SQL Generation
The `queryBuilder` SHALL apply `DATE_TRUNC` to any column identified as a date/timestamp that is present in the `GROUP BY` clause when a granularity is selected.

#### Scenario: SQL generation with Month granularity
- **WHEN** user selects "Month" and has a date column "published_date" in the "Group By" zone
- **THEN** the generated SQL SHALL use `DATE_TRUNC('month', ... "published_date" ...)` in both `SELECT` and `GROUP BY` clauses
