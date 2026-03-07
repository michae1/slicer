## Why

Додавання панелі "Метрики" (Measures) необхідне для можливості агрегації числових полів у drag-and-drop інтерфейсі. Це дозволить користувачам зручно будувати запити з математичними операціями (наприклад, сума) безпосередньо з UI.

## What Changes

- Додається нова панель "Measures" ("Метрики") після панелі фільтрів.
- Встановлюється ліміт на максимальну кількість елементів (5) для всіх трьох панелей: Dimensions, Filters, Measures.
- Налаштовується обмеження, за яким у панель "Measures" можна перетягнути лише числові поля (numeric).
- Для кожного поля у панелі "Measures" додається dropdown селектор агрегацій.
- Агрегацією за замовчуванням встановлюється `SUM`.
- Значення цих полів (з вибраними агрегаціями) інтегруються в генерацію SQL запитів.
- Додається базова валідація drop-умов і відповідні unit тести.

## Capabilities

### New Capabilities
- `metrics-panel`: Drag and drop panel for measures with aggregation selection, validation rules, and SQL query integration.

### Modified Capabilities
<!-- None, since there are no existing specs yet -->

## Impact

- **UI Components:** `ResultsTable.tsx` and related components need to render the new Measures drop zone and aggregation dropdowns.
- **State Management / DND Logic:** Adding rules for maximum items per panel (5) and validating field types (only numeric for Measures).
- **Query Builder:** Handling the Measures array, compiling them into `SELECT` aggregations like `SUM(column)`.
- **Testing:** New test suites for drop validation and SQL generation.
