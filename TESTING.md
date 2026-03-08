# Testing Guide

## Overview

This project uses two testing frameworks:
- **Jest** for unit tests of non-visual functionality
- **Playwright** for E2E tests of user interactions

## Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npx playwright test

# Run E2E tests in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/smoke.spec.ts
```

## Test Coverage

### Unit Tests

Unit tests cover the following non-visual functionality:

1. **Data Formatters** (`src/utils/__tests__/dataFormatters.test.ts`)
   - Numeric formatting with K/M/B suffixes
   - Currency and percentage formatting
   - Date formatting (short, long, relative)
   - Boolean and text formatting
   - Column type detection

2. **Query Cache** (`src/utils/__tests__/queryCache.test.ts`)
   - Cache set/get operations
   - Query key generation
   - LRU eviction strategy
   - TTL expiration
   - Cache statistics
   - Table invalidation

3. **File Validation** (`src/utils/__tests__/fileValidation.test.ts`)
   - CSV validation (structure, columns, empty rows)
   - Parquet validation (size warnings)
   - GeoJSON validation (structure, features)
   - Error detection and reporting

4. **Query Builder** (`src/services/__tests__/queryBuilder.test.ts`)
   - SQL generation for SELECT queries
   - GROUP BY with aggregates
   - WHERE clause with filters
   - SQL injection prevention
   - Query complexity estimation
   - Distinct values and count queries

5. **Validation** (`src/utils/__tests__/validation.test.ts`)
   - Query validation (syntax, keywords)
   - Table name validation
   - File validation (size, format)
   - Error handling

### E2E Tests

E2E tests cover the following user flows:

1. **Smoke Test** (`tests/smoke.spec.ts`)
   - Application loads successfully
   - File upload functionality
   - Data preview display

2. **Drag and Drop** (`tests/drag-drop.spec.ts`)
   - Dimension drag and drop
   - Group by zone interaction
   - Filter zone interaction

## Test Structure

```
data-explorer/
├── src/
│   ├── services/
│   │   └── __tests__/
│   │       └── queryBuilder.test.ts
│   └── utils/
│       └── __tests__/
│           ├── dataFormatters.test.ts
│           ├── fileValidation.test.ts
│           ├── queryCache.test.ts
│           └── validation.test.ts
└── tests/
    ├── smoke.spec.ts
    └── drag-drop.spec.ts
```

## Writing New Tests

### Unit Tests

Create test files in `__tests__` directories next to the code being tested:

```typescript
import { MyUtility } from '../myUtility';

describe('MyUtility', () => {
  describe('myMethod', () => {
    it('should do something', () => {
      const result = MyUtility.myMethod('input');
      expect(result).toBe('expected');
    });
  });
});
```

### E2E Tests

Create test files in the `tests/` directory:

```typescript
import { test, expect } from '@playwright/test';

test('should perform user action', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});
```

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## CI/CD Integration

Tests should be run in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm test -- --coverage

- name: Run E2E tests
  run: npx playwright test
```
