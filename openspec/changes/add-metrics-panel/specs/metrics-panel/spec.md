## ADDED Requirements

### Requirement: Panel Maximum Capacity
The system MUST enforce a limit of a maximum of 5 items for all three drag-and-drop panels (Dimensions, Filters, Measures).

#### Scenario: Dropping a sixth item
- **WHEN** a user tries to drop a 6th item into any of the three panels (Dimensions, Filters, Measures)
- **THEN** the panel MUST reject the item and keep the existing 5 items.

### Requirement: Measures Panel Accepts Only Numeric Fields
The system MUST restrict the "Measures" panel to accept only fields that are of `numeric` type.

#### Scenario: Dropping a numeric field
- **WHEN** a user drops a numeric field into the "Measures" panel
- **THEN** the system MUST accept the field.

#### Scenario: Dropping a non-numeric field
- **WHEN** a user drops a non-numeric (e.g., string or boolean) field into the "Measures" panel
- **THEN** the system MUST reject the field and the field MUST NOT be added to the Measures array.

### Requirement: Default Aggregation for Measures
The system MUST automatically assign a default aggregation of `SUM` to any field dropped into the "Measures" panel.

#### Scenario: Dropping a new numeric field
- **WHEN** a user drops a new numeric field into the "Measures" panel
- **THEN** an aggregation dropdown MUST appear next to the field, defaulting to the `SUM` selection.

### Requirement: Modify Aggregation for Measures
The system MUST allow users to change the aggregation type using a dropdown selector for each field in the "Measures" panel.

#### Scenario: Changing aggregation
- **WHEN** a user selects a different aggregated function (e.g., `AVG`) from the dropdown for a specific measure
- **THEN** the system MUST update the field's aggregation state to `AVG`.

### Requirement: SQL Query Integration
The system MUST integrate the fields from the "Measures" panel alongside their selected aggregation function directly into the generated SQL query.

#### Scenario: Query generation with measures
- **WHEN** the "Measures" panel contains at least one field and the system generates the SQL query
- **THEN** the generated query MUST include the measure with its selected aggregation function in the `SELECT` clause (e.g., `SUM(field_name)`).
