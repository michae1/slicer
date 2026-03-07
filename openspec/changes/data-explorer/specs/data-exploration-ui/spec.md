## ADDED Requirements

### Requirement: Interactive dimensions and metrics panels
The system SHALL provide left sidebar with separate sections for Dimensions (string/enum fields) and Metrics (numeric fields) with search functionality.

#### Scenario: Dimensions panel display
- **WHEN** data is loaded successfully
- **THEN** system displays Dimensions panel with all string and categorical columns
- **THEN** system shows search input to filter dimension list
- **THEN** each dimension displays field name and sample values
- **THEN** dimensions are draggable to Group By and Filters zones

#### Scenario: Metrics panel display
- **WHEN** data is loaded successfully
- **THEN** system displays Metrics panel with all numeric columns
- **THEN** system shows search input to filter metrics list
- **THEN** each metric displays field name and basic statistics (min, max, avg)
- **THEN** metrics are non-draggable but selectable for aggregation

#### Scenario: Panel search functionality
- **WHEN** user types in dimensions search box
- **THEN** system filters dimension list to show matching fields
- **WHEN** user clears search input
- **THEN** system shows all dimensions again

### Requirement: Drag and drop Group By zone
The system SHALL provide a Group By area where users can drag dimensions to create grouping for data aggregation.

#### Scenario: Drag dimension to Group By
- **WHEN** user drags a dimension from Dimensions panel to Group By zone
- **THEN** dimension appears as removable chip in Group By area
- **THEN** system updates query to include GROUP BY clause
- **THEN** results table updates to show grouped data

#### Scenario: Remove dimension from Group By
- **WHEN** user clicks X button on dimension chip in Group By
- **THEN** dimension is removed from Group By zone
- **THEN** system updates query to remove GROUP BY clause
- **THEN** results table updates accordingly

#### Scenario: Multiple dimensions in Group By
- **WHEN** user drags multiple dimensions to Group By zone
- **THEN** dimensions appear as ordered list of chips
- **THEN** system creates hierarchical grouping in results
- **THEN** results show grouped data with expand/collapse functionality

### Requirement: Drag and drop Filters zone
The system SHALL provide a Filters area where users can drag dimensions and configure filter values via multi-select checkboxes.

#### Scenario: Drag dimension to Filters
- **WHEN** user drags a dimension from Dimensions panel to Filters zone
- **THEN** dimension appears as filter section with multi-select checkboxes
- **THEN** system shows unique values for that dimension
- **THEN** user can select multiple values via checkboxes
- **THEN** system updates query to include WHERE clause

#### Scenario: Filter value selection
- **WHEN** user selects checkbox for dimension value
- **THEN** filter is applied to the query
- **WHEN** user deselects checkbox
- **THEN** filter is removed from query
- **WHEN** user selects multiple values
- **THEN** system creates IN clause with selected values

#### Scenario: Filter removal
- **WHEN** user clicks remove button on filter section
- **THEN** entire filter is removed from Filters zone
- **THEN** system updates query to remove WHERE clause for that dimension
- **THEN** results update to show all values for that dimension

### Requirement: Responsive layout adaptation
The system SHALL adapt layout for mobile devices with collapsible panels and touch-friendly interactions.

#### Scenario: Mobile layout adaptation
- **WHEN** screen width is less than 768px
- **THEN** sidebar becomes collapsible hamburger menu
- **THEN** Group By and Filters zones stack vertically
- **THEN** drag and drop areas become larger touch targets
- **THEN** table results use horizontal scrolling for wide data