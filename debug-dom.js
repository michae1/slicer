import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:5173");
  await page.setInputFiles('input[type="file"]', "public/test-data.csv");
  await page.waitForSelector("text=Results", { timeout: 30000 });
  await page.waitForSelector("#group-by-zone");

  // perform manual drag from department to group by
  const sidebar = page.locator("div.bg-gray-50.border-r");
  const dimensionElement = sidebar.getByText("department", { exact: true });
  const groupByZone = page.locator("#group-by-zone");
  const srcBox = await dimensionElement.boundingBox();
  const tgtBox = await groupByZone.boundingBox();
  if (srcBox && tgtBox) {
    await page.mouse.move(
      srcBox.x + srcBox.width / 2,
      srcBox.y + srcBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      tgtBox.x + tgtBox.width / 2,
      tgtBox.y + tgtBox.height / 2,
      { steps: 15 },
    );
    await page.mouse.up();
  }
  await page.waitForTimeout(1000);
  const summaryText = await groupByZone.innerText();
  console.log("summary:", summaryText);

  // click to expand
  await groupByZone.click();
  await page.waitForTimeout(500);
  const parentHtml = await page.$eval(
    "#group-by-zone",
    (el) => el.parentElement?.innerHTML,
  );
  console.log("parent after expand html:\n", parentHtml);

  await browser.close();
})();
