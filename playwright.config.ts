import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const useExternalBaseUrl = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI and locally for flaky tests */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Screenshot on failure */
    screenshot: "only-on-failure",
    /* Video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Chromium-specific timeouts - increased for Stripe Embedded Checkout
        actionTimeout: 30 * 1000,
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        // Firefox needs more time for iframe operations and Stripe
        actionTimeout: 45 * 1000,
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        // WebKit needs more time for iframe operations and Stripe
        actionTimeout: 45 * 1000,
      },
    },
    {
      name: "smoke",
      grep: /@smoke|@cart/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "critical",
      grep: /@critical|@checkout/,
      grepInvert: /@integration/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "integration",
      grep: /@integration/,
      use: {
        ...devices["Desktop Chrome"],
        actionTimeout: 45 * 1000,
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: useExternalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },

  /* Test timeout - 120 seconds for checkout flow (Embedded Checkout needs more time, especially with Stripe) */
  timeout: 120 * 1000,
  /* Expect timeout - increased for iframe operations, especially for Firefox/WebKit */
  expect: {
    timeout: 35 * 1000,
  },
});
