## 1. State Management

- [x] 1.1 Add `dateGranularity` (`'none' | 'day' | 'week' | 'month' | 'year'`) to `useDragDropStore` state in `src/stores/dragDropStore.ts`.
- [x] 1.2 Add `setDateGranularity` action to the store.

## 2. Query Builder Implementation

- [x] 2.1 Update `src/services/queryBuilder.ts` to read `dateGranularity` from the state.
- [x] 2.2 Implement a helper function `isDateColumnCheck` (or similar) to identify date-like columns by name or type.
- [x] 2.3 Update SQL generation logic: if granularity is not 'none', wrap grouped date columns with `DATE_TRUNC`.

## 3. UI Implementation

- [x] 3.1 Create/Modify a section in `src/components/ResultsTable.tsx` (above the results) to render the "Granularity" dropdown.
- [x] 3.2 Connect the selector to the store's `dateGranularity` state and `setDateGranularity` action.
- [x] 3.3 Ensure selecting a granularity triggers a re-run of the analysis (usually via a `useEffect` on `dateGranularity`).

## 4. Verification & Testing

- [x] 4.1 Manually verify that selecting "Month" groups data correctly.
- [x] 4.2 Check that the table header correctly reflects the grouped column name if an alias is used for truncated dates.
- [x] 4.3 Test with at least one dataset containing Unix timestamps to ensure `TO_TIMESTAMP` conversion works.
- [x] 4.4 Added 25 automated tests in `src/services/__tests__/queryBuilder.test.ts` to cover `DATE_TRUNC`, `DATE RANGE` filters, `shortenType`, and Unix timestamp handling.
