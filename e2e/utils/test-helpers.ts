import { Page, expect } from "@playwright/test";

/**
 * Clear cart state from localStorage
 * Cart is stored in Zustand with key "cart-storage"
 * Note: Page must be on a valid origin (after navigation) to access localStorage
 * Now verifies that cart is actually cleared
 * Uses header-specific selector to avoid matching filter badges
 */
export async function clearCart(page: Page): Promise<void> {
  // Ensure we're on a page before trying to access localStorage
  const url = page.url();
  if (!url || url === "about:blank") {
    await page.goto("/");
  }
  
  await page.evaluate(() => {
    try {
      localStorage.removeItem("cart-storage");
    } catch {
      // localStorage may not be available in some contexts, ignore
    }
  });

  // Wait for cart storage mutation to apply in UI.
  await page.waitForFunction(() => {
    try {
      const data = localStorage.getItem("cart-storage");
      if (!data) return true;
      const parsed = JSON.parse(data);
      const items = parsed.state?.items || parsed.items || [];
      return items.length === 0;
    } catch {
      return false;
    }
  });
  // Use header-specific selector to avoid matching filter badges
  const cartBadge = page.locator('header [data-testid="cart-badge-count"]');
  
  // Check if badge exists and verify it's not showing a count
  const badgeVisible = await cartBadge.isVisible({ timeout: 1000 }).catch(() => false);
  if (badgeVisible) {
    const badgeText = await cartBadge.textContent();
    const badgeCount = badgeText ? parseInt(badgeText.trim(), 10) : 0;
    if (badgeCount > 0) {
      // Retry clearing
      await page.evaluate(() => {
        localStorage.removeItem("cart-storage");
      });
      await page.waitForFunction(() => {
        try {
          const data = localStorage.getItem("cart-storage");
          if (!data) return true;
          const parsed = JSON.parse(data);
          const items = parsed.state?.items || parsed.items || [];
          return items.length === 0;
        } catch {
          return false;
        }
      });
    }
  }
}

/**
 * Wait for Stripe Embedded Checkout elements to load
 * Stripe Embedded Checkout (ui_mode: "custom") has separate iframes for shipping and payment
 * The Payment Element and ShippingAddressElement are rendered in separate iframes
 * Improved with better iframe detection using URL matching and frame load events
 */
export async function waitForStripe(page: Page, timeout = 20000): Promise<void> {
  await expect
    .poll(
      async () => {
        let foundStripeFrame = false;
        for (const frame of page.frames()) {
          const frameUrl = frame.url();
          const isStripeFrame =
            frameUrl.includes("stripe.com") ||
            frameUrl.includes("js.stripe.com") ||
            frameUrl.includes("__privateStripeFrame") ||
            frameUrl.includes("elements.stripe.com");
          if (!isStripeFrame) continue;
          foundStripeFrame = true;
          break;
        }
        return foundStripeFrame;
      },
      { timeout, message: "Stripe frames did not become ready" }
    )
    .toBeTruthy();
}

/**
 * Map state codes to full state names for Stripe dropdown
 * Stripe uses full state names in their dropdown
 */
const STATE_CODE_TO_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

/**
 * Fill Stripe Shipping Address form
 * This must be filled before the payment form in Embedded Checkout
 * Explicitly targets each field by accessible name to avoid filling wrong fields
 * @param page Playwright page object
 * @param fullName Full name for shipping
 * @param address Address line 1
 * @param city City name
 * @param state State code (e.g., "CA") or full name (e.g., "California")
 * @param zipCode ZIP code
 */
export async function fillShippingAddressForm(
  page: Page,
  fullName: string = "Test User",
  address: string = "123 Test St",
  city: string = "San Francisco",
  state: string = "CA",
  zipCode: string = "94102"
): Promise<void> {
  await waitForStripe(page);
  await dismissCookieConsent(page);

  const shippingFrame = await expect
    .poll(async () => {
      for (const frame of page.frames()) {
        const visible = await frame
          .locator('[autocomplete*="name"], [autocomplete*="address"], [autocomplete*="postal-code"], [aria-label*="address" i], [placeholder*="address" i], input[name*="address"], input[name*="city"]')
          .isVisible({ timeout: 500 })
          .catch(() => false);
        if (visible) return frame.name() || frame.url();
      }
      return null;
    }, { timeout: 10000 })
    .not.toBeNull()
    .then(async () => {
      for (const frame of page.frames()) {
        const visible = await frame
          .locator('[autocomplete*="name"], [autocomplete*="address"], [autocomplete*="postal-code"], [aria-label*="address" i], [placeholder*="address" i], input[name*="address"], input[name*="city"]')
          .isVisible({ timeout: 500 })
          .catch(() => false);
        if (visible) return frame;
      }
      return null;
    });
  if (!shippingFrame) {
    throw new Error("Could not find shipping address iframe");
  }

  const fullNameField = shippingFrame
    .getByRole("textbox", { name: /full name|name/i })
    .or(shippingFrame.locator('[autocomplete*="name"], input[name*="name"], [aria-label*="name" i]'))
    .first();
  await fullNameField.waitFor({ state: "visible", timeout: 10000 });
  await fullNameField.fill(fullName);

  const addressCombobox = shippingFrame
    .getByRole("combobox", { name: /address/i })
    .or(shippingFrame.getByRole("textbox", { name: /address/i }))
    .or(shippingFrame.locator('[autocomplete*="address-line1"], [autocomplete*="address"], input[name*="address"], [aria-label*="address" i]'))
    .first();
  await addressCombobox.waitFor({ state: "visible", timeout: 5000 });
  await addressCombobox.fill(address);
  await page.keyboard.press("Escape");
  const cityField = shippingFrame
    .getByRole("textbox", { name: /city/i })
    .or(shippingFrame.locator('[autocomplete*="address-level2"], input[name*="city"], [aria-label*="city" i]'))
    .first();
  await cityField.waitFor({ state: "visible", timeout: 10000 });
  await cityField.fill(city);

  const stateName = STATE_CODE_TO_NAME[state.toUpperCase()] || state;
  const stateCombobox = shippingFrame
    .getByRole("combobox", { name: /state|province|region/i })
    .or(shippingFrame.getByRole("textbox", { name: /state|province|region/i }))
    .or(shippingFrame.locator('[autocomplete*="address-level1"], input[name*="state"], [aria-label*="state" i]'))
    .first();
  await stateCombobox.waitFor({ state: "visible", timeout: 10000 });
  await stateCombobox.fill(stateName);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  const zipField = shippingFrame
    .getByRole("textbox", { name: /zip|postal/i })
    .or(shippingFrame.locator('[autocomplete*="postal-code"], input[name*="zip"], input[name*="postal"], [aria-label*="zip" i], [aria-label*="postal" i]'))
    .first();
  await zipField.waitFor({ state: "visible", timeout: 10000 });
  await zipField.fill(zipCode);
  await waitForCheckoutReady(page, 15000);
}

/**
 * Fill Stripe Payment Element form with test card details
 * For Embedded Checkout (ui_mode: "custom"), the payment form is in a separate iframe
 * @param page Playwright page object
 * @param cardNumber Test card number (default: success card)
 * @param expiryDate Card expiry (default: future date)
 * @param cvc CVC code (default: 123)
 */
export async function fillStripePaymentForm(
  page: Page,
  cardNumber: string = "4242 4242 4242 4242",
  expiryDate: string = "12/34",
  cvc: string = "123"
): Promise<void> {
  await waitForStripe(page);

  const paymentFrame = await expect
    .poll(async () => {
      for (const frame of page.frames()) {
        const visible = await frame
          .locator('input[autocomplete*="cc-"], input[name*="card"], [aria-label*="card" i], [placeholder*="card" i], [placeholder*="MM / YY" i], [name*="exp" i]')
          .isVisible({ timeout: 500 })
          .catch(() => false);
        if (visible) return frame.name() || frame.url();
      }
      return null;
    }, { timeout: 10000 })
    .not.toBeNull()
    .then(async () => {
      for (const frame of page.frames()) {
        const visible = await frame
          .locator('input[autocomplete*="cc-"], input[name*="card"], [aria-label*="card" i], [placeholder*="card" i], [placeholder*="MM / YY" i], [name*="exp" i]')
          .isVisible({ timeout: 500 })
          .catch(() => false);
        if (visible) return frame;
      }
      return null;
    });
  if (!paymentFrame) {
    throw new Error("Could not find payment iframe");
  }

  const cardNumberField = paymentFrame
    .getByRole("textbox", { name: /card number|card/i })
    .or(paymentFrame.locator('input[autocomplete="cc-number"], input[name*="card"], [aria-label*="card number" i], [placeholder*="card number" i]'))
    .first();
  await cardNumberField.waitFor({ state: "visible", timeout: 10000 });
  await cardNumberField.fill(cardNumber);

  const expiryField = paymentFrame
    .getByRole("textbox", { name: /expiration date|expiry|exp/i })
    .or(paymentFrame.locator('input[autocomplete="cc-exp"], input[name*="exp"], [placeholder*="MM / YY" i]'))
    .first();
  await expiryField.waitFor({ state: "visible", timeout: 5000 });
  await expiryField.fill(expiryDate);

  const cvcField = paymentFrame
    .getByRole("textbox", { name: /security code|cvc|cvv/i })
    .or(paymentFrame.locator('input[autocomplete="cc-csc"], input[name*="cvc"], input[name*="cvv"], [aria-label*="security" i], [placeholder*="CVC" i]'))
    .first();
  await cvcField.waitFor({ state: "visible", timeout: 5000 });
  await cvcField.fill(cvc);
  await waitForCheckoutReady(page, 15000);
}

/**
 * Wait until checkout is no longer showing validating/calc states.
 * This avoids fixed sleeps in checkout specs.
 */
export async function waitForCheckoutReady(page: Page, timeout = 15000): Promise<void> {
  const statusText = page.locator("text=/validating|calculating/i");
  const visible = await statusText.isVisible({ timeout: 1500 }).catch(() => false);
  if (visible) {
    await statusText.waitFor({ state: "hidden", timeout });
  }
}

/**
 * Wait for checkout to settle after submit attempts that should remain on checkout.
 */
export async function waitForCheckoutAfterSubmit(page: Page, timeout = 10000): Promise<void> {
  await Promise.race([
    page.waitForURL(/\/checkout/, { timeout }),
    page.locator('[role="alert"], [data-testid="checkout-error"], [class*="destructive"]').first().waitFor({
      state: "visible",
      timeout,
    }),
  ]).catch(() => {});
}

/**
 * Dismiss cookie consent banner if present
 */
export async function dismissCookieConsent(page: Page): Promise<void> {
  try {
    // Wait a moment for the banner to appear
    await page.waitForTimeout(500);
    
    // Look for the Accept button in the cookie consent banner
    const acceptButton = page.locator('button').filter({ hasText: /^Accept$/i }).first();
    
    if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // Cookie consent may not be present, that's okay
  }
}

/**
 * Retry a function with exponential backoff
 * Useful for flaky operations that might fail due to timing issues
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 500, maxDelay = 2000 } = options;
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Add the first product from the products page to cart and navigate to checkout.
 * Reusable for checkout happy path and error specs. Uses page only (no PO imports).
 * @param page Playwright page
 * @returns Product name of the added item (for assertions). Throws if no products available.
 */
export async function addFirstProductAndGoToCheckout(
  page: Page
): Promise<{ productName: string }> {
  await page.goto("/products");
  await page.waitForLoadState("domcontentloaded");
  await dismissCookieConsent(page);

  await page.waitForSelector('[role="article"], [data-testid="product-card"]', {
    state: "visible",
    timeout: 15000,
  });

  const firstCard = page.locator('[role="article"], [data-testid="product-card"]').first();
  const productName =
    (await firstCard.locator("h3").first().textContent()) ||
    (await firstCard.locator("a").first().textContent());

  if (!productName?.trim()) {
    throw new Error("No products available for addFirstProductAndGoToCheckout");
  }

  const addButton = firstCard
    .locator('[data-testid="add-to-cart-button"]')
    .or(firstCard.getByRole("button", { name: /add to cart/i }));
  await addButton.waitFor({ state: "visible", timeout: 5000 });
  await addButton.click({ force: true });

  await verifyCartBadgeCount(page, 1);
  await waitForCartHydration(page);

  await page.goto("/checkout");
  await page.waitForLoadState("domcontentloaded");
  await waitForCartHydration(page);

  return { productName: productName.trim() };
}

/**
 * Setup test environment - navigate to base URL, dismiss cookie consent, and clear cart
 * Enhanced with better isolation and retry logic
 * Uses header-specific selectors to avoid matching filter badges
 */
export async function setupTest(page: Page): Promise<void> {
  // Navigate first to ensure we have a valid origin for localStorage
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  
  // Dismiss cookie consent if present
  await dismissCookieConsent(page);
  
  // Clear cart with retry logic for better reliability
  await retryWithBackoff(async () => {
    await clearCart(page);
    // Verify cart is actually cleared - use header-specific selector
    const cartBadge = page.locator('header [data-testid="cart-badge-count"]');
    const badgeVisible = await cartBadge.isVisible({ timeout: 2000 }).catch(() => false);
    if (badgeVisible) {
      const badgeText = await cartBadge.textContent();
      const badgeCount = badgeText ? parseInt(badgeText.trim(), 10) : 0;
      if (badgeCount > 0) {
        throw new Error(`Cart not cleared - badge shows ${badgeCount} items`);
      }
    }
    
    // Also verify localStorage is cleared
    // Note: Zustand persist middleware wraps data in a "state" object
    const cartData = await page.evaluate(() => {
      try {
        const data = localStorage.getItem("cart-storage");
        if (!data) return { isEmpty: true };
        const parsed = JSON.parse(data);
        // Zustand persist format: { state: { items: [...], ... }, version: 0 }
        const items = parsed.state?.items || parsed.items || [];
        return { isEmpty: items.length === 0 };
      } catch {
        return { isEmpty: false };
      }
    });
    
    if (!cartData.isEmpty) {
      throw new Error("Cart not cleared - localStorage still has items");
    }
  }, { maxRetries: 5, initialDelay: 300 });
  
  // Wait for cart hydration to ensure state is consistent
  await waitForCartHydration(page, 5000);
  
  // Final verification - ensure cart is truly empty
  // Note: Zustand persist middleware wraps data in a "state" object
  const finalCheck = await page.evaluate(() => {
    try {
      const data = localStorage.getItem("cart-storage");
      if (!data) return true;
      const parsed = JSON.parse(data);
      // Zustand persist format: { state: { items: [...], ... }, version: 0 }
      const items = parsed.state?.items || parsed.items || [];
      return items.length === 0;
    } catch {
      return false;
    }
  });
  
  if (!finalCheck) {
    console.warn("Cart may not be fully cleared after setup");
  }
}

/**
 * Wait for Next.js page to be fully loaded
 * Useful for SSR pages that need time to hydrate
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Wait for API response from checkout endpoint
 */
export async function waitForCheckoutInit(page: Page): Promise<void> {
  await page.waitForResponse(
    (response) => response.url().includes("/api/checkout") && response.status() === 200,
    { timeout: 15000 }
  );
}

/**
 * Wait for cart store to hydrate from localStorage
 * This ensures Zustand's persist middleware has finished rehydrating
 * Enhanced to check both localStorage, DOM state, and wait for cart badge to reflect state
 * Uses header-specific selector to avoid matching filter badges on products page
 */
export async function waitForCartHydration(page: Page, timeout = 10000): Promise<void> {
  const startTime = Date.now();
  
  // First, wait for localStorage to have valid data structure
  // Note: Zustand persist middleware wraps data in a "state" object
  while (Date.now() - startTime < timeout) {
    const localStorageReady = await page.evaluate(() => {
      try {
        const cartData = localStorage.getItem("cart-storage");
        if (!cartData) {
          return { ready: true, isEmpty: true }; // Empty state is valid
        }
        
        const parsed = JSON.parse(cartData);
        if (parsed && typeof parsed === "object") {
          // Zustand persist format: { state: { items: [...], ... }, version: 0 }
          const items = parsed.state?.items || parsed.items || [];
          return { ready: true, isEmpty: items.length === 0, itemCount: items.length };
        }
        return { ready: false };
      } catch {
        return { ready: false };
      }
    });

    if (localStorageReady.ready) {
      // localStorage is ready, now wait for DOM to reflect the state
      // Use header-specific selector to avoid matching filter badges
      const cartBadge = page.locator('header [data-testid="cart-badge-count"]');
      const badgeWaitStart = Date.now();
      const badgeTimeout = Math.min(3000, timeout - (Date.now() - startTime));
      
      // Wait for cart badge to reflect the correct state
      while (Date.now() - badgeWaitStart < badgeTimeout) {
        const badgeVisible = await cartBadge.isVisible({ timeout: 500 }).catch(() => false);
        
        if (localStorageReady.isEmpty) {
          // Cart is empty - badge should not be visible
          if (!badgeVisible) {
            // Badge is correctly hidden, hydration complete
            await page.waitForTimeout(200);
            return;
          }
        } else {
          // Cart has items - badge should be visible with correct count
          if (badgeVisible) {
            const badgeText = await cartBadge.textContent().catch(() => null);
            if (badgeText !== null) {
              const badgeCount = parseInt(badgeText.trim(), 10);
              // Verify badge count matches localStorage (allow some tolerance for async updates)
              if (badgeCount > 0 && badgeCount <= (localStorageReady.itemCount || 0) + 1) {
                await page.waitForTimeout(200);
                return;
              }
            }
          }
        }
        
        await page.waitForTimeout(200);
      }
      
      // If we couldn't verify badge state but localStorage is ready, assume hydrated
      // This handles cases where badge might not be visible yet but cart is ready
      await page.waitForTimeout(300);
      return;
    }

    await page.waitForTimeout(200);
  }
  
  // Final check - if localStorage has valid data, assume hydrated even if badge check failed
  // Note: Zustand persist middleware wraps data in a "state" object
  const finalCheck = await page.evaluate(() => {
    try {
      const cartData = localStorage.getItem("cart-storage");
      if (!cartData) return true; // Empty is valid
      const parsed = JSON.parse(cartData);
      // Check for valid Zustand persist format
      return parsed && typeof parsed === "object" && (parsed.state !== undefined || parsed.items !== undefined);
    } catch {
      return false;
    }
  });
  
  if (!finalCheck) {
    console.warn("Cart hydration check timed out - localStorage may not be ready");
  } else {
    // Even if badge check failed, if localStorage is valid, wait a bit more for DOM
    await page.waitForTimeout(500);
  }
}

/**
 * Verify cart badge count matches expected value
 * Uses specific header selector to avoid matching filter badges on products page
 * @param page Playwright page object
 * @param expectedCount Expected count in cart badge (0 means badge should not be visible)
 */
export async function verifyCartBadgeCount(page: Page, expectedCount: number): Promise<void> {
  // Use header-specific selector to avoid matching filter badges on products page
  const cartBadge = page.locator('header [data-testid="cart-badge-count"]');
  
  if (expectedCount === 0) {
    // Badge should not be visible when cart is empty
    await expect(cartBadge).not.toBeVisible({ timeout: 5000 });
  } else {
    // Badge should be visible and show the correct count
    await expect(cartBadge).toBeVisible({ timeout: 8000 });
    
    // Wait for badge text to stabilize (Zustand hydration can cause brief flickers)
    await page.waitForTimeout(300);
    
    const badgeText = await cartBadge.textContent();
    const badgeCount = badgeText ? parseInt(badgeText.trim(), 10) : 0;
    
    if (badgeCount !== expectedCount) {
      // One retry if count doesn't match - might be a timing issue
      await page.waitForTimeout(500);
      const retryText = await cartBadge.textContent();
      const retryCount = retryText ? parseInt(retryText.trim(), 10) : 0;
      expect(retryCount).toBe(expectedCount);
    }
  }
}

/**
 * Take a screenshot with a descriptive name for debugging test failures
 * @param page Playwright page object
 * @param name Descriptive name for the screenshot
 */
export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
  try {
    await page.screenshot({
      path: `test-results/debug-${name}-${Date.now()}.png`,
      fullPage: true,
    });
  } catch {
    // Screenshot might fail, ignore
  }
}

/**
 * Wait for element with better error messages
 * @param locator Playwright locator
 * @param action Description of what we're waiting for (for error messages)
 * @param timeout Timeout in milliseconds
 */
export async function waitForElementWithMessage(
  locator: { waitFor: (opts: { state: string; timeout: number }) => Promise<void> },
  action: string,
  timeout = 10000
): Promise<void> {
  try {
    await locator.waitFor({ state: "visible", timeout });
  } catch {
    throw new Error(`Failed to ${action} after ${timeout}ms. Element: ${locator}`);
  }
}
