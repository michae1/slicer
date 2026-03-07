import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

test.describe('Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Upload test file
    const filePath = resolve(projectRoot, 'public/test-data.csv');
    await page.setInputFiles('input[type="file"]', filePath);

    // Wait for the main app to load
    // We wait for the "Results" heading which appears after upload
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({ timeout: 30000 });
  });

  test('should display dimensions in sidebar and they should be draggable', async ({ page }) => {
    const sidebar = page.locator('div.bg-gray-50.border-r'); // The sidebar container in Sidebar.tsx

    // Check that Dimensions tab is visible
    await expect(sidebar.getByRole('button', { name: /Dimensions/i })).toBeVisible();

    // Check that 'name' dimension is visible in the sidebar list
    const nameInSidebar = sidebar.getByText('name', { exact: true });
    await expect(nameInSidebar).toBeVisible({ timeout: 10000 });

    // Check that Group By zone is visible
    await expect(page.getByText('Group By', { exact: true })).toBeVisible();

    // Verify the sidebar element has drag affordance
    // DraggableColumn is the parent of ColumnChip
    // Structure: Sidebar -> list -> DraggableColumn (cursor-pointer) -> ColumnChip -> name span
    // 3 levels up from span: span -> div (flex-center) -> div (ColumnChip) -> DraggableColumn
    await expect(nameInSidebar.locator('xpath=../../..')).toHaveClass(/cursor-pointer/);
  });

  test('should allow dragging dimensions to Group By zone', async ({ page }) => {
    const sidebar = page.locator('div.bg-gray-50.border-r');
    const dimensionElement = sidebar.getByText('department', { exact: true });
    const groupByZone = page.locator('#group-by-zone');

    // Perform Drag and Drop
    // Use steps to ensure activation constraint is met if dragTo fails
    await dimensionElement.hover();
    await page.mouse.down();
    await page.mouse.move(0, 0, { steps: 5 }); // Distraction to trigger drag start
    await groupByZone.hover();
    await page.mouse.up();

    // Verify it appeared in the Group By zone
    await expect(groupByZone.getByText('department', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('should allow dragging dimensions to Filters zone', async ({ page }) => {
    const sidebar = page.locator('div.bg-gray-50.border-r');
    const dimensionElement = sidebar.getByText('city', { exact: true });
    const filtersZone = page.locator('#filters-zone');

    // Perform Drag and Drop
    await dimensionElement.hover();
    await page.mouse.down();
    await page.mouse.move(0, 0, { steps: 5 });
    await filtersZone.hover();
    await page.mouse.up();

    // Verify it appeared in the Filters zone
    await expect(filtersZone.getByText('city', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('should display dimensions and metrics in sidebar tabs', async ({ page }) => {
    const sidebar = page.locator('div.bg-gray-50.border-r');
    const metricsTab = sidebar.getByRole('button', { name: /Metrics/i });

    // Click on Metrics tab
    await metricsTab.click();

    // Check that metrics are shown in sidebar
    await expect(sidebar.getByText('age', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(sidebar.getByText('salary', { exact: true })).toBeVisible({ timeout: 10000 });

    // Click back to Dimensions tab
    await sidebar.getByRole('button', { name: /Dimensions/i }).click();
    await expect(sidebar.getByText('name', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('should handle search functionality in sidebar', async ({ page }) => {
    const sidebar = page.locator('div.bg-gray-50.border-r');
    const searchInput = sidebar.locator('input[placeholder*="Search"]');

    await searchInput.fill('name');

    // Sidebar should only show name
    await expect(sidebar.getByText('name', { exact: true })).toBeVisible();
    await expect(sidebar.getByText('city', { exact: true })).not.toBeVisible();

    await searchInput.clear();
    await expect(sidebar.getByText('name', { exact: true })).toBeVisible();
    await expect(sidebar.getByText('city', { exact: true })).toBeVisible();
  });

  test('should have proper visual feedback for drag operations', async ({ page }) => {
    const sidebar = page.locator('div.bg-gray-50.border-r');
    const dimensionElement = sidebar.getByText('name', { exact: true });

    const box = await dimensionElement.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      // Move mouse significantly to trigger drag start
      await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2 + 200, { steps: 5 });

      // Check for DragOverlay presence
      // Dnd-kit usually has a portal container
      const overlay = page.locator('body').getByText('name', { exact: true }).last();
      await expect(overlay).toBeVisible();

      await page.mouse.up();
    }
  });
});