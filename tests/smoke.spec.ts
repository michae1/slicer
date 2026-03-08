import { test, expect, chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

test('smoke test - page loads and shows upload UI', async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/michaelplakhov/Library/Caches/ms-playwright/chromium-1028/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
  });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173');

  // Check main heading is visible
  await expect(page.getByRole('heading', { name: 'Data Explorer' })).toBeVisible();

  // Check feature cards - use exact match
  await expect(page.getByText('Fast', { exact: true })).toBeVisible();
  await expect(page.getByText('Secure', { exact: true })).toBeVisible();
  await expect(page.getByText('Powerful', { exact: true })).toBeVisible();

  // Check upload area
  await expect(page.getByText('Drop your file here')).toBeVisible();
  await expect(page.getByText('CSV', { exact: true })).toBeVisible();

  // Test file upload
  const filePath = resolve(projectRoot, 'public/test-data.csv');
  await page.setInputFiles('input[type="file"]', filePath);

  // Wait for file processing to complete
  await page.waitForTimeout(15000);

  // Verify we moved to the main application interface
  await expect(page.getByText('Table:')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#table-panel')).toBeVisible({ timeout: 10000 });

  console.log('Smoke test with file upload passed!');
  await browser.close();
});
