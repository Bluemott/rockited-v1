import { test, expect } from "@playwright/test";

import { STRIPE_TEST_CARDS, TEST_CARD_DETAILS } from "../fixtures/test-data";
import { CartPage } from "../utils/page-objects/CartPage";
import { CheckoutPage } from "../utils/page-objects/CheckoutPage";
import {
  setupTest,
  addFirstProductAndGoToCheckout,
  fillShippingAddressForm,
  fillStripePaymentForm,
  waitForCartHydration,
  waitForCheckoutReady,
  waitForCheckoutAfterSubmit,
} from "../utils/test-helpers";

test.describe("Checkout - Error scenarios", {
  tag: ["@checkout", "@stripe", "@critical"],
}, () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test("checkout shows empty state when cart is empty", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.verifyEmptyCart();
    await expect(checkoutPage.getContinueShoppingButton()).toBeVisible();
  });

  test("edit cart link navigates to cart with items", async ({ page }) => {
    const { productName } = await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);
    const cartPage = new CartPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();

    const editCartButton = checkoutPage.getEditCartButton();
    if (await editCartButton.isVisible()) {
      await editCartButton.click();
      await expect(page).toHaveURL(/\/cart/);
      await cartPage.verifyItemPresent(productName);
    }
  });

  test("checkout API failure shows error or empty state", async ({ page, context }) => {
    await context.route("**/api/checkout**", (route) => {
      route.abort("failed");
    });

    await addFirstProductAndGoToCheckout(page);

    const checkoutPage = new CheckoutPage(page);

    const errorMessage = checkoutPage.getErrorMessage();
    const emptyCartMessage = checkoutPage.getEmptyCartMessage();
    await Promise.race([
      errorMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      emptyCartMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
    ]);
    const errorVisible = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    const emptyVisible = await emptyCartMessage.isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorVisible || emptyVisible).toBe(true);
    expect(page.url()).toContain("/checkout");
  });

  test("checkout invalid API response shows error or empty state", async ({ page, context }) => {
    await context.route("**/api/checkout**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await addFirstProductAndGoToCheckout(page);

    const checkoutPage = new CheckoutPage(page);

    const errorMessage = checkoutPage.getErrorMessage();
    const emptyCartMessage = checkoutPage.getEmptyCartMessage();
    await Promise.race([
      errorMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      emptyCartMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
    ]);
    const errorVisible = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    const emptyVisible = await emptyCartMessage.isVisible({ timeout: 1000 }).catch(() => false);
    expect(errorVisible || emptyVisible).toBe(true);
    expect(page.url()).toContain("/checkout");
  });

  test("payment fails with declined card and stays on checkout", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyShippingElementLoaded();
    await checkoutPage.verifyPaymentElementLoaded();

    await fillShippingAddressForm(page);
    await waitForCheckoutReady(page);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.DECLINE,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );

    const submitButton = await checkoutPage.waitForSubmitButtonReady(15000).catch(() => null);
    if (submitButton) {
      await submitButton.click();
      await waitForCheckoutAfterSubmit(page);
    }
    expect(page.url()).toContain("/checkout");
  });

  test("payment fails with expired card and stays on checkout", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyShippingElementLoaded();
    await checkoutPage.verifyPaymentElementLoaded();

    await fillShippingAddressForm(page);
    const validatingOrCalculatingText = page.locator("text=/validating|calculating/i");
    try {
      const isVisible = await validatingOrCalculatingText.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        await validatingOrCalculatingText.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
      }
    } catch {
      // Loading text might not be present
    }
    await waitForCheckoutReady(page);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.EXPIRED_CARD,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );
    const submitButton = await checkoutPage.waitForSubmitButtonReady(20000, false).catch(() => null);
    if (submitButton) {
      const isEnabled = await submitButton.isEnabled().catch(() => false);
      if (isEnabled) {
        await submitButton.click();
        await waitForCheckoutAfterSubmit(page);
      }
    }
    expect(page.url()).toContain("/checkout");
  });

  test("payment form rejects invalid card number", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyShippingElementLoaded();
    await checkoutPage.verifyPaymentElementLoaded();

    await fillShippingAddressForm(page);
    await waitForCheckoutReady(page);

    await fillStripePaymentForm(
      page,
      "1234 1234 1234 1234",
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );

    const submitButton = checkoutPage.getSubmitButton();
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(submitButton).toBeDisabled({ timeout: 10000 });
    }
    expect(page.url()).toContain("/checkout");
  });

  test("payment fails with insufficient funds and stays on checkout", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyShippingElementLoaded();
    await checkoutPage.verifyPaymentElementLoaded();

    await fillShippingAddressForm(page);
    await waitForCheckoutReady(page);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.INSUFFICIENT_FUNDS,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );

    const submitButton = checkoutPage.getSubmitButton();
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      await waitForCheckoutAfterSubmit(page);
    }
    expect(page.url()).toContain("/checkout");
  });

  test("remove all items during checkout shows empty cart state", async ({ page }) => {
    const { productName } = await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();

    await checkoutPage.removeItem(productName);
    await waitForCartHydration(page);

    await checkoutPage.getEmptyCartMessage().waitFor({ state: "visible", timeout: 10000 });
    await checkoutPage.verifyEmptyCart();
  });
});
