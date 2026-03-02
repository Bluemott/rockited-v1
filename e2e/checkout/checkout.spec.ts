import { test } from "@playwright/test";

import { STRIPE_TEST_CARDS, TEST_CARD_DETAILS } from "../fixtures/test-data";
import { CheckoutPage } from "../utils/page-objects/CheckoutPage";
import { CheckoutSuccessPage } from "../utils/page-objects/CheckoutSuccessPage";
import {
  setupTest,
  addFirstProductAndGoToCheckout,
  fillShippingAddressForm,
  fillStripePaymentForm,
} from "../utils/test-helpers";

test.describe("Checkout - Happy path", { tag: ["@checkout", "@stripe"] }, () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test("complete checkout from product to success page", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);

    const checkoutPage = new CheckoutPage(page);
    const successPage = new CheckoutSuccessPage(page);

    await checkoutPage.verifyLoaded();
    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.verifyOrderSummaryVisible();

    await checkoutPage.waitForInitialization();

    const emptyCartMessage = checkoutPage.getEmptyCartMessage();
    const isEmpty = await emptyCartMessage.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isEmpty) {
      await checkoutPage.verifyPaymentElementLoaded();
      await checkoutPage.verifyShippingElementLoaded();
    }

    await fillShippingAddressForm(
      page,
      "Test User",
      "123 Test St",
      "San Francisco",
      "CA",
      "94102"
    );

    const validatingOrCalculatingText = page.locator("text=/validating|calculating/i");
    try {
      const isVisible = await validatingOrCalculatingText.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        await validatingOrCalculatingText.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
      }
    } catch {
      // Loading text might not be present
    }
    // Brief settle for shipping validation to complete (Stripe has no other observable state here)
    await page.waitForTimeout(500);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.SUCCESS,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );
    // waitForSubmitButtonReady below will poll until button is enabled (Stripe card validation)
    await page.waitForTimeout(800);

    const submitButton = await checkoutPage.waitForSubmitButtonReady(25000);
    await submitButton.click();

    await page.waitForURL(
      (url) =>
        url.toString().includes("session_id=") || url.toString().includes("/checkout/success"),
      { timeout: 30000 }
    );

    const url = page.url();
    const sessionIdMatch = url.match(/session_id=([^&]+)/);
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : undefined;

    await successPage.verifySuccess();
    if (sessionId) {
      await successPage.verifySessionId(sessionId);
    }
  });
});
