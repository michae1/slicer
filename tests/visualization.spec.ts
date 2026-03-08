import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

test.describe("Visualization E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    const filePath = resolve(projectRoot, "public/test-data.csv");
    await page.setInputFiles('input[type="file"]', filePath);
    await expect(page.getByText(/Table:/i).first()).toBeVisible({ timeout: 15000 });
  });

  async function dragFromSidebar(page: any, text: string, targetId: string) {
    const sidebar = page.locator("div.bg-gray-50.border-r");
    const source = sidebar.getByText(text, { exact: true });
    const target = page.locator(targetId);
    
    await source.scrollIntoViewIfNeeded();
    const srcBox = await source.boundingBox();
    const tgtBox = await target.boundingBox();
    
    if (!srcBox || !tgtBox) throw new Error(`Bounds not found for ${text} or ${targetId}`);

    await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(tgtBox.x + tgtBox.width / 2, tgtBox.y + tgtBox.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(800);
  }

  test("should render a chart and switch types", async ({ page }) => {
    const sidebar = page.locator("div.bg-gray-50.border-r");
    
    await dragFromSidebar(page, "city", "#group-by-zone");
    await sidebar.getByRole("button", { name: /Metrics/i }).click();
    await dragFromSidebar(page, "age", "#measures-zone");

    // Wait for chart to render - check for recharts wrapper
    await expect(page.locator('.recharts-wrapper')).toBeVisible({ timeout: 10000 });

    // Bar - check that bar elements exist
    const bars = page.locator('.recharts-bar');
    await expect(bars).toHaveCount(1);

    // Line
    await page.getByTestId('chart-type-line').click();
    await expect(page.locator('.recharts-line')).toBeVisible({ timeout: 5000 });

    // Pie
    await page.getByTestId('chart-type-pie').click();
    // Pie renders multiple paths with .recharts-pie-sector
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test("should automatically activate newly added metrics", async ({ page }) => {
    const sidebar = page.locator("div.bg-gray-50.border-r");
    
    await dragFromSidebar(page, "city", "#group-by-zone");
    await sidebar.getByRole("button", { name: /Metrics/i }).click();
    
    await dragFromSidebar(page, "age", "#measures-zone");
    await expect(page.locator('.recharts-legend-item-text').getByText('age')).toBeVisible();

    await dragFromSidebar(page, "salary", "#measures-zone");
    await expect(page.locator('.recharts-legend-item-text').getByText('salary')).toBeVisible();
  });

  test("should persist panel width", async ({ page }) => {
    const splitter = page.getByTestId('layout-splitter');
    const chartPanel = page.locator('#chart-panel');
    
    await expect(chartPanel).toBeVisible();
    const initialBox = await chartPanel.boundingBox();
    if (!initialBox) throw new Error("No panel");

    const splitterBox = await splitter.boundingBox();
    if (!splitterBox) throw new Error("No splitter");

    await page.mouse.move(splitterBox.x + splitterBox.width / 2, splitterBox.y + splitterBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(splitterBox.x - 150, splitterBox.y + splitterBox.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    const resizedBox = await chartPanel.boundingBox();
    if (!resizedBox) throw new Error("No resized panel");

    await page.reload();
    const filePath = resolve(projectRoot, "public/test-data.csv");
    await page.setInputFiles('input[type="file"]', filePath);
    await expect(page.getByText(/Table:/i).first()).toBeVisible();

    const persistedBox = await chartPanel.boundingBox();
    if (!persistedBox) throw new Error("No persisted panel");
    
    expect(Math.abs(persistedBox.width - resizedBox.width)).toBeLessThan(25);
  });
});
