## ADDED Requirements

### Requirement: Automatic Chart Type Selection
The system SHALL automatically select a default chart type (Bar, Line, or Pie) based on the current results schema (dimensions and measures).

#### Scenario: Bar chart for discrete dimensions
- **WHEN** the query has one dimension (string) and one or more measures
- **THEN** the system SHALL default to a Bar chart

#### Scenario: Line chart for time-series
- **WHEN** the query has exactly one time-based dimension and one or more measures
- **THEN** the system SHALL default to a Line chart

### Requirement: Manual Chart Type Switching
The system SHALL allow users to manually switch between Bar, Line, and Pie chart types.

#### Scenario: Switching chart type
- **WHEN** the user selects "Pie" from the chart type switcher
- **THEN** the chart SHALL re-render as a Pie chart if the configuration is valid

### Requirement: Axis Mapping
The system SHALL provide UI selectors to map query result columns to chart axes (X-axis, Y-axis, Color/Group).

#### Scenario: Changing X-axis
- **WHEN** the user selects a different column for the X-axis
- **THEN** the chart SHALL update to use the selected column as the category/time axis

### Requirement: Smart Validation
The system SHALL validate if the current query configuration is suitable for the selected chart type.

#### Scenario: Invalid configuration for Pie chart
- **WHEN** the user selects Pie chart but has multiple non-summable measures or no dimension
- **THEN** the system SHALL display a message: "Configuration not suitable for Pie chart" and disable the chart view or fall back to Table Only message.

### Requirement: Resource Efficient Rendering
The system SHALL render charts efficiently, limiting the number of data points to 1000 to maintain browser performance.

#### Scenario: Large dataset rendering
- **WHEN** the query returns 5000 rows
- **THEN** the system SHALL sample or truncate the data to the first 1000 rows for rendering the chart
