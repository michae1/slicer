## ADDED Requirements

### Requirement: Dynamic SQL query generation
The system SHALL generate SQL queries dynamically based on user selections in Group By and Filters zones without exposing raw SQL.

#### Scenario: Basic SELECT query generation
- **WHEN** user selects no Group By dimensions
- **THEN** system generates simple SELECT query with chosen columns
- **THEN** query includes appropriate WHERE clauses for applied filters
- **THEN** query result limits to 1000 rows for performance

#### Scenario: Grouped query generation
- **WHEN** user drags dimensions to Group By zone
- **THEN** system adds GROUP BY clause with selected dimensions
- **THEN** system includes aggregate functions for numeric metrics
- **THEN** system generates HAVING clause if aggregate filters applied

#### Scenario: Filter query generation
- **WHEN** user applies dimension filters
- **THEN** system creates WHERE clause with IN operators for selected values
- **THEN** system handles NULL values appropriately in filters
- **THEN** system combines multiple filter conditions with AND operators

### Requirement: Query result caching and optimization
The system SHALL cache query results and optimize repeated queries to improve performance.

#### Scenario: Query result caching
- **WHEN** user executes identical query multiple times
- **THEN** system returns cached results immediately
- **THEN** system shows "Cached" indicator in results
- **THEN** system invalidates cache when underlying data changes

#### Scenario: Query optimization
- **WHEN** user performs complex aggregation query
- **THEN** system attempts to optimize query execution order
- **THEN** system uses appropriate indexes when available
- **THEN** system shows query execution time in results

### Requirement: Real-time query updates
The system SHALL automatically update query results when user modifies Group By or Filters selections.

#### Scenario: Real-time Group By update
- **WHEN** user adds or removes dimension from Group By
- **THEN** system regenerates query and executes immediately
- **THEN** system shows loading state in results table
- **THEN** system updates results without page refresh

#### Scenario: Real-time Filter update
- **WHEN** user selects or deselects filter values
- **THEN** system updates WHERE clause and executes query
- **THEN** system shows filtered results immediately
- **THEN** system updates result count and statistics

#### Scenario: Bulk update handling
- **WHEN** user makes multiple rapid changes to query parameters
- **THEN** system debounces queries to prevent excessive execution
- **THEN** system shows latest result after debounce period
- **THEN** system cancels pending queries if newer request arrives

### Requirement: Query history and persistence
The system SHALL maintain query history and allow users to return to previous query states.

#### Scenario: Query history tracking
- **WHEN** user executes query with different parameters
- **THEN** system stores query parameters in history array
- **THEN** system limits history to last 10 queries
- **THEN** system allows navigation to previous queries

#### Scenario: Query state persistence
- **WHEN** user refreshes page during analysis
- **THEN** system restores previous Group By and Filter selections
- **THEN** system re-executes last query and shows results
- **THEN** system maintains query history across sessions

### Requirement: Query validation and safety
The system SHALL validate queries before execution to prevent errors and ensure safety.

#### Scenario: Query parameter validation
- **WHEN** user applies invalid filter values
- **THEN** system validates data types and formats before query execution
- **THEN** system shows validation error if parameter is invalid
- **THEN** system prevents query execution with invalid parameters

#### Scenario: Safe query generation
- **WHEN** system constructs SQL query from user inputs
- **THEN** system escapes all user-provided values to prevent SQL injection
- **THEN** system validates column names exist in current dataset
- **THEN** system prevents execution of potentially harmful queries