## 1. Drag and Drop Logic Updates

- [ ] 1.1 In `ResultsTable.tsx`, add state for `measures` (an array of columns storing optional `aggregation`).
- [ ] 1.2 Update the drag-and-drop sort callback (e.g., `handleSort`) to handle the new `measures` drop zone.
- [ ] 1.3 Add validation logic in `handleSort` to prevent dropping more than 5 items into Dimensions, Filters, and Measures.
- [ ] 1.4 Add validation logic in `handleSort` to prevent dropping non-numeric fields into the Measures zone.

## 2. UI Updates

- [ ] 2.1 Render the "Метрики" (Measures) drop zone panel directly below the Filters panel.
- [ ] 2.2 For items dropped in the Measures panel, render an aggregation dropdown (SUM, AVG, MIN, MAX, COUNT, etc.).
- [ ] 2.3 Set the default aggregation for new items dropped in the Measures panel to `SUM`.
- [ ] 2.4 Add an `onChange` handler for the aggregation dropdown to update the particular item's aggregation state in the `measures` array.

## 3. SQL Generator Integration

- [ ] 3.1 Update the SQL query builder hook or utility to read the `measures` state.
- [ ] 3.2 Ensure the generated SQL includes `AGGREGATION_FUNCTION(column_name)` correctly mapped within the `SELECT` clause whenever fields exist in the Measures panel.

## 4. Tests

- [ ] 4.1 Write a unit test verifying that the Dimensions, Filters, and Measures panels cannot accept a 6th item.
- [ ] 4.2 Write a unit test verifying that non-numeric fields cannot be added to the Measures panel.
- [ ] 4.3 Write a unit test verifying that adding a field to the Measures panel results in the correct SQL query output (with `SUM` by default).
