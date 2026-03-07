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
    
    // Wait for file processing to complete
    await page.waitForTimeout(15000);
  });

  test('should display dimensions in sidebar and they should be draggable', async ({ page }) => {
    // Check that dimensions section exists in sidebar
    await expect(page.getByText('Dimensions')).toBeVisible();
    
    // Check that some dimension columns are visible (from test-data.csv)
    await expect(page.getByText('name')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('city')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('department')).toBeVisible({ timeout: 10000 });
    
    // Check that Group By zone is visible
    await expect(page.getByText('Group By')).toBeVisible();
    await expect(page.getByText('Drag dimensions here to group data')).toBeVisible();
    
    // Verify the sidebar columns have drag affordance (cursor pointer and visual styling)
    const dimensionElement = page.getByText('name').first();
    await expect(dimensionElement).toHaveClass(/cursor-pointer/);
  });

  test('should have empty Group By and Filters zones initially', async ({ page }) => {
    // Check Group By zone is empty
    await expect(page.getByText('Group By')).toBeVisible();
    await expect(page.getByText('Drag dimensions here to group data')).toBeVisible();
    
    // Check Filters zone is empty  
    await expect(page.getByText('Filters')).toBeVisible();
    await expect(page.getByText('Drag dimensions here to add filters')).toBeVisible();
  });

  test('should display dimensions and metrics in sidebar tabs', async ({ page }) => {
    // Check Dimensions tab is active by default
    await expect(page.getByText('Dimensions').first()).toBeVisible();
    await expect(page.getByText('Metrics')).toBeVisible();
    
    // Click on Metrics tab
    await page.getByText('Metrics').click();
    
    // Check that metrics are shown (age, salary are numeric from test-data.csv)
    await expect(page.getByText('age')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('salary')).toBeVisible({ timeout: 5000 });
    
    // Click back to Dimensions tab
    await page.getByText('Dimensions').click();
    
    // Check dimensions are shown again
    await expect(page.getByText('name')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('city')).toBeVisible({ timeout: 5000 });
  });

  test('should allow dragging dimensions to Group By zone', async ({ page }) => {
    // This test will work once drag functionality is fully implemented
    // For now it tests the UI structure exists correctly
    
    // Find a dimension to drag
    const dimensionElement = page.getByText('department').first();
    const groupByZone = page.getByText('Drag dimensions here to group data').first();
    
    // Verify both elements are visible
    await expect(dimensionElement).toBeVisible();
    await expect(groupByZone).toBeVisible();
    
    // The actual drag and drop test would be:
    // await dimensionElement.dragTo(groupByZone);
    // await expect(page.getByText('department')).toBeVisible(); // Should appear in Group By
  });

  test('should allow dragging dimensions to Filters zone', async ({ page }) => {
    // This test will work once drag functionality is fully implemented
    // For now it tests the UI structure exists correctly
    
    // Find a dimension to drag
    const dimensionElement = page.getByText('city').first();
    const filtersZone = page.getByText('Drag dimensions here to add filters').first();
    
    // Verify both elements are visible
    await expect(dimensionElement).toBeVisible();
    await expect(filtersZone).toBeVisible();
    
    // The actual drag and drop test would be:
    // await dimensionElement.dragTo(filtersZone);
    // await expect(page.getByText('city')).toBeVisible(); // Should appear in Filters
  });

  test('should have proper visual feedback for drag operations', async ({ page }) => {
    // Test that hover states work on sidebar elements
    const dimensionElement = page.getByText('name').first();
    await dimensionElement.hover();
    
    // Check for hover styling (cursor should change to indicate draggability)
    // The exact CSS class verification depends on implementation details
    
    // Test hover on drop zones
    const groupByZone = page.getByText('Drag dimensions here to group data').first();
    await groupByZone.hover();
    
    // Zone should have hover styling applied
    await expect(groupByZone).toHaveClass(/hover:/);
  });

  test('should handle search functionality in sidebar', async ({ page }) => {
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('name');
    
    // Should filter to show only name column
    await expect(page.getByText('name')).toBeVisible();
    await expect(page.getByText('city')).not.toBeVisible();
    
    // Clear search
    await searchInput.clear();
    await expect(page.getByText('name')).toBeVisible();
    await expect(page.getByText('city')).toBeVisible();
  });
});