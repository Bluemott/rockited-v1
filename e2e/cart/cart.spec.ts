import { test, expect } from "@playwright/test";

import { CartPage } from "../utils/page-objects/CartPage";
import { ProductPage } from "../utils/page-objects/ProductPage";
import {
  setupTest,
  waitForCartHydration,
  verifyCartBadgeCount,
} from "../utils/test-helpers";

test.describe("Cart - Add, update, remove, persist, proceed to checkout", {
  tag: "@cart",
}, () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test("cart badge updates when adding first product", async ({ page }) => {
    const productPage = new ProductPage(page);
    await productPage.goto();
    await productPage.waitForProducts();

    const firstProductCard = page.locator('[role="article"]').first();
    const firstProductName =
      (await firstProductCard.locator("h3").first().textContent()) ||
      (await firstProductCard.locator("a").first().textContent());

    if (!firstProductName?.trim()) {
      test.skip(true, "No products available for testing");
      return;
    }

    await productPage.addToCart(firstProductName.trim());
    await verifyCartBadgeCount(page, 1);
    await waitForCartHydration(page);
  });

  test("cart page shows added item and allows update quantity and remove", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await productPage.goto();
    await productPage.waitForProducts();

    const productCards = page.locator('[role="article"]');
    const productCount = await productCards.count();

    if (productCount < 2) {
      test.skip(true, "Not enough products for this test");
      return;
    }

    const firstProductName = (
      (await productCards.nth(0).locator("h3").first().textContent()) ||
      (await productCards.nth(0).locator("a").first().textContent())
    )?.trim() || "";
    const secondProductName = (
      (await productCards.nth(1).locator("h3").first().textContent()) ||
      (await productCards.nth(1).locator("a").first().textContent())
    )?.trim() || "";

    await productPage.addToCart(firstProductName);
    await productPage.addToCart(secondProductName);
    await verifyCartBadgeCount(page, 2);
    await waitForCartHydration(page);

    await cartPage.goto();
    await cartPage.verifyItemPresent(firstProductName);
    await cartPage.verifyItemPresent(secondProductName);

    await cartPage.updateQuantity(firstProductName, 2);
    await waitForCartHydration(page);

    const quantity = await cartPage.getQuantity(firstProductName);
    expect(quantity).toBe(2);

    await cartPage.removeItem(secondProductName);
    await waitForCartHydration(page);

    await expect(cartPage.getCartItem(secondProductName)).not.toBeVisible();
    await cartPage.verifyItemPresent(firstProductName);
  });

  test("cart persists across navigation", async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await productPage.goto();
    await productPage.waitForProducts();

    const firstProductCard = page.locator('[role="article"]').first();
    const firstProductName =
      (await firstProductCard.locator("h3").first().textContent()) ||
      (await firstProductCard.locator("a").first().textContent());

    if (!firstProductName?.trim()) {
      test.skip(true, "No products available for testing");
      return;
    }

    await productPage.addToCart(firstProductName.trim());
    await verifyCartBadgeCount(page, 1);
    await waitForCartHydration(page);

    await page.goto("/");
    await waitForCartHydration(page);

    await cartPage.goto();
    await cartPage.verifyItemPresent(firstProductName.trim());
  });

  test("proceed to checkout navigates to checkout when cart has items", async ({
    page,
  }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await productPage.goto();
    await productPage.waitForProducts();

    const firstProductCard = page.locator('[role="article"]').first();
    const firstProductName =
      (await firstProductCard.locator("h3").first().textContent()) ||
      (await firstProductCard.locator("a").first().textContent());

    if (!firstProductName?.trim()) {
      test.skip(true, "No products available for testing");
      return;
    }

    await productPage.addToCart(firstProductName.trim());
    await verifyCartBadgeCount(page, 1);
    await waitForCartHydration(page);

    await cartPage.goto();
    await cartPage.verifyItemPresent(firstProductName.trim());
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/\/checkout/);
  });
});
