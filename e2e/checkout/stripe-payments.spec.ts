/**
 * Stripe payment flow E2E tests.
 * Requires Stripe test keys (sk_test_*, pk_test_*) in .env.local.
 * Use test cards from e2e/fixtures/test-data.ts (see https://docs.stripe.com/testing).
 */
import { test, expect } from "@playwright/test";

import { STRIPE_TEST_CARDS, TEST_CARD_DETAILS } from "../fixtures/test-data";
import { CheckoutPage } from "../utils/page-objects/CheckoutPage";
import { CheckoutSuccessPage } from "../utils/page-objects/CheckoutSuccessPage";
import {
  setupTest,
  addFirstProductAndGoToCheckout,
  fillShippingAddressForm,
  fillStripePaymentForm,
} from "../utils/test-helpers";

test.describe("Stripe payments", { tag: ["@checkout", "@stripe"] }, () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test("Payment Element and payment form load after shipping", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.verifyLoaded();
    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();

    await checkoutPage.verifyShippingElementLoaded();
    await checkoutPage.verifyPaymentElementLoaded();

    await fillShippingAddressForm(
      page,
      "Test User",
      "123 Test St",
      "San Francisco",
      "CA",
      "94102"
    );

    const validatingOrCalculatingText = page.locator("text=/validating|calculating/i");
    await validatingOrCalculatingText.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});

    await page.waitForTimeout(500);

    const submitButton = checkoutPage.getSubmitButton();
    await expect(submitButton).toBeVisible({ timeout: 10000 });
  });

  test("successful payment with test card completes to success page", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);
    const successPage = new CheckoutSuccessPage(page);

    await checkoutPage.verifyLoaded();
    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.verifyOrderSummaryVisible();
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyPaymentElementLoaded();
    await checkoutPage.verifyShippingElementLoaded();

    await fillShippingAddressForm(
      page,
      "Test User",
      "123 Test St",
      "San Francisco",
      "CA",
      "94102"
    );

    await page.locator("text=/validating|calculating/i").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.SUCCESS,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );
    await page.waitForTimeout(800);

    const submitButton = await checkoutPage.waitForSubmitButtonReady(25000);
    await submitButton.click();

    await page.waitForURL(
      (url) =>
        url.toString().includes("session_id=") || url.toString().includes("/checkout/success"),
      { timeout: 30000 }
    );

    await successPage.verifySuccess();
  });

  test("declined card shows error and stays on checkout", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyShippingElementLoaded();
    await checkoutPage.verifyPaymentElementLoaded();

    await fillShippingAddressForm(
      page,
      "Test User",
      "123 Test St",
      "San Francisco",
      "CA",
      "94102"
    );
    await page.locator("text=/validating|calculating/i").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.DECLINE,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );
    await page.waitForTimeout(800);

    const submitButton = await checkoutPage.waitForSubmitButtonReady(15000).catch(() => null);
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(5000);
    }

    expect(page.url()).toContain("/checkout");
    const errorArea = page.locator('[class*="destructive"]').or(page.getByText(/declined|failed|error/i));
    await expect(errorArea.first()).toBeVisible({ timeout: 8000 });
  });

  test("insufficient funds card shows error and stays on checkout", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyShippingElementLoaded();
    await checkoutPage.verifyPaymentElementLoaded();

    await fillShippingAddressForm(
      page,
      "Test User",
      "123 Test St",
      "San Francisco",
      "CA",
      "94102"
    );
    await page.locator("text=/validating|calculating/i").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.INSUFFICIENT_FUNDS,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );
    await page.waitForTimeout(800);

    const submitButton = await checkoutPage.waitForSubmitButtonReady(15000).catch(() => null);
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(5000);
    }

    expect(page.url()).toContain("/checkout");
    const errorArea = page.locator('[class*="destructive"]').or(page.getByText(/insufficient|declined|failed|error/i));
    await expect(errorArea.first()).toBeVisible({ timeout: 8000 });
  });

  test("checkout session includes tax details after payment with address in tax-test state", async ({
    page,
    request,
  }) => {
    await addFirstProductAndGoToCheckout(page);
    const checkoutPage = new CheckoutPage(page);
    const successPage = new CheckoutSuccessPage(page);

    await checkoutPage.verifyLoaded();
    await checkoutPage.waitForCartItemsVisible(15000);
    await checkoutPage.verifyOrderSummaryVisible();
    await checkoutPage.waitForInitialization();
    await checkoutPage.verifyPaymentElementLoaded();
    await checkoutPage.verifyShippingElementLoaded();

    // Use Idaho address (often used for Stripe Tax testing; tax depends on Dashboard registration)
    await fillShippingAddressForm(
      page,
      "Test User",
      "456 Tax Test Ave",
      "Boise",
      "ID",
      "83702"
    );

    await page.locator("text=/validating|calculating/i").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);

    await fillStripePaymentForm(
      page,
      STRIPE_TEST_CARDS.SUCCESS,
      TEST_CARD_DETAILS.EXPIRY_DATE,
      TEST_CARD_DETAILS.CVC
    );
    await page.waitForTimeout(800);

    const submitButton = await checkoutPage.waitForSubmitButtonReady(25000);
    await submitButton.click();

    await page.waitForURL(
      (url) =>
        url.toString().includes("session_id=") || url.toString().includes("/checkout/success"),
      { timeout: 30000 }
    );

    await successPage.verifySuccess();

    const url = page.url();
    const sessionIdMatch = url.match(/session_id=([^&]+)/);
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
    expect(sessionId).toBeTruthy();

    const sessionRes = await request.get(`/api/checkout/session?session_id=${sessionId}`);
    expect(sessionRes.ok()).toBe(true);
    const sessionData = await sessionRes.json();
    expect(sessionData.total_details).toBeDefined();
    expect(typeof sessionData.total_details?.amount_tax).toBe("number");
  });
});
