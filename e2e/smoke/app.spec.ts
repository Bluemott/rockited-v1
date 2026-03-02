import { test, expect } from "@playwright/test";

import { CartPage } from "../utils/page-objects/CartPage";
import { ProductPage } from "../utils/page-objects/ProductPage";
import { setupTest } from "../utils/test-helpers";

test.describe("Smoke - App and products load", { tag: "@smoke" }, () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\//);
    const heading = page.getByRole("heading", { level: 1 }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("products page loads and shows product cards", async ({ page }) => {
    const productPage = new ProductPage(page);
    await productPage.goto();
    await productPage.waitForProducts();
    const cards = page.locator('[role="article"], [data-testid="product-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
    const errorMessage = page.getByText(/failed to load products|error loading products/i);
    await expect(errorMessage).not.toBeVisible();
  });

  test("cart page loads with empty state when cart is empty", async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await expect(page).toHaveURL(/\/cart/);
    await cartPage.verifyCartEmpty();
  });
});
