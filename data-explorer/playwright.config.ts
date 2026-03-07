import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  /*
   * Automatically start the local dev server before running tests. This
   * ensures Playwright can navigate to the app without requiring a manual
   * `npm run dev` in another terminal.
   */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120000,
  },
  use: {
    headless: true,
  },
});
