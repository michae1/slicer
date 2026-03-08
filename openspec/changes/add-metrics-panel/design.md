## Context

Currently, the data explorer features a drag-and-drop interface for "Dimensions" and "Filters". To allow users to compute aggregations, we need a third panel: "Measures". This requires updating the drag-and-drop logic to support a new drop zone, adding constraints to the number of items per zone, enforcing data type restrictions, and integrating the dropped items into the query generator logic.

## Goals / Non-Goals

**Goals:**
- Implement a third drag-and-drop zone called "Measures".
- Restrict all 3 panels (Dimensions, Filters, Measures) to a maximum of 5 items each.
- Restrict the "Measures" panel to accept only fields of type `numeric`.
- Provide a UI (dropdown) to select an aggregation function for each numeric field in the "Measures" panel.
- Default to `SUM` aggregation upon drop.
- Ensure the UI actions reflect directly on the generated SQL query.
- Add unit tests enforcing drop rules.

**Non-Goals:**
- Support custom aggregations (e.g., custom formulas).
- Support non-numeric aggregations (e.g., COUNT on strings) in the initial release.

## Decisions

- **Drop Zone Validation:** Implement custom validation rules in the `onDragEnd` or sorting callbacks of the drag-and-drop library. We'll check the field type and the current item count of the destination zone before allowing a drop.
- **Aggregation State:** The state structure storing the columns will be updated to hold an optional `aggregation` property (`{ field: string, type: string, aggregation?: string }`). This avoids creating a completely separate state tree for measures and easily links back to the SQL builder.
- **SQL Generation:** The query builder will read from the `measures` array. For each item, it will emit `{aggregation}({field})`.
- **UI Element:** A straightforward native or library-provided select dropdown will be nested within the sorted item component inside the "Measures" panel.

## Risks / Trade-offs

- **Risk:** Validation logic could make the drag-and-drop interaction feel clunky if not optimized. -> **Mitigation:** Perform fast, client-side only checks strictly inside event handlers.
- **Risk:** Incompatible types dragged to metrics. -> **Mitigation:** The drag-and-drop layer will explicitly reject drops (snap back) for non-numeric fields inside the Measures zone.
