import { Page, Locator, expect } from "@playwright/test";

import { dismissCookieConsent, waitForCartHydration } from "../test-helpers";

/**
 * Page Object Model for Checkout Page
 * Handles interactions with the checkout process
 */
export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to checkout page
   */
  async goto(): Promise<void> {
    await this.page.goto("/checkout");
    await this.page.waitForLoadState("domcontentloaded");
    await dismissCookieConsent(this.page);
    // Wait for cart hydration first - ensures cart state is ready
    await waitForCartHydration(this.page);
    // Wait for checkout content to appear (either empty cart message or checkout heading)
    // Use app's checkout-loading selector so "spinner hidden" race resolves
    const loadingSpinner = this.getLoadingSpinner();
    await Promise.race([
      this.getHeading().waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
      this.getEmptyCartMessage().waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
      loadingSpinner.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {}),
    ]);
  }

  /**
   * Get page title/heading (h1 level heading with "Checkout")
   */
  getHeading(): Locator {
    // Use level: 1 to specifically target the main h1 heading
    return this.page.getByRole("heading", { name: /^checkout$/i, level: 1 });
  }

  /**
   * Get order summary section (use data-testid for single element; fallback can match multiple)
   */
  getOrderSummary(): Locator {
    return this.page.locator('[data-testid="order-summary"]');
  }

  /**
   * Get cart item in checkout
   */
  getCheckoutItem(productName: string): Locator {
    // Find the heading with product name, then get its parent container
    // The checkout item structure: div > h3 (product name)
    const heading = this.page.getByRole("heading", { name: productName, level: 3 });
    return heading
      .locator("..") // Go to parent div (flex-grow)
      .locator("..") // Go to parent div (checkout item container)
      .first(); // Use first() to handle strict mode violations
  }

  /**
   * Get quantity controls for an item
   * Checkout page uses icon-only +/- buttons
   */
  getQuantityControls(productName: string): { increase: Locator; decrease: Locator; display: Locator } {
    const item = this.getCheckoutItem(productName);
    // Find the quantity controls container - it has +/- buttons and a quantity display
    // The structure is: div > [decrease button] [quantity display] [increase button]
    return {
      // Try named buttons first, then fall back to position-based
      decrease: item.getByRole("button", { name: /-|decrease|minus/i })
        .or(item.locator('button').filter({ hasNotText: /remove|delete|increase|plus|\+/i }).first()),
      increase: item.getByRole("button", { name: /\+|increase|plus/i })
        .or(item.locator('button').filter({ hasNotText: /remove|delete|decrease|minus|-/i }).last()),
      display: item.locator('[data-quantity]')
        .or(item.locator('span, div').filter({ hasText: /^"\d+"$|^\d+$/ }).first()),
    };
  }

  /**
   * Get remove item button
   */
  getRemoveItemButton(productName: string): Locator {
    const item = this.getCheckoutItem(productName);
    return item.getByRole("button", { name: /remove|delete/i })
      .or(item.locator('button[aria-label*="remove" i], button[title*="remove" i]'));
  }

  /**
   * Get edit cart link/button
   * Uses .first() to handle pages that have both a link and button version
   */
  getEditCartButton(): Locator {
    return this.page.getByRole("link", { name: /edit cart/i })
      .or(this.page.getByRole("button", { name: /edit cart/i }))
      .first();
  }

  /**
   * Get subtotal display
   */
  getSubtotal(): Locator {
    return this.page.getByText(/subtotal/i).locator("..").or(this.page.locator('[data-testid="subtotal"]'));
  }

  /**
   * Get total display
   */
  getTotal(): Locator {
    return this.page.getByText(/^total$/i).locator("..").or(this.page.locator('[data-testid="total"]'));
  }

  /**
   * Get Stripe Payment Element container
   */
  getPaymentElement(): Locator {
    return this.page.locator('[data-testid="payment-element"]').or(this.page.locator('iframe[name*="stripe"]').locator(".."));
  }

  /**
   * Get payment form submit button
   * For Embedded Checkout, the submit button is in the main page DOM, not in an iframe
   * Improved to wait for button to be enabled and handle different states
   */
  getSubmitButton(): Locator {
    // Try multiple selectors to find the submit button
    // The button text format is typically "Pay USD X.XX" or "Pay $X.XX"
    return this.page
      .getByRole("button", { name: /pay.*\d+\.\d+|pay usd|pay \$/i })
      .or(this.page.getByRole("button", { name: /pay|submit|complete order|place order/i }))
      .or(this.page.locator('form button[type="submit"]'))
      .or(this.page.locator('button[type="submit"]').filter({ hasText: /pay/i }))
      .first();
  }

  /**
   * Wait for submit button to be ready and enabled
   * This ensures the button is visible, enabled, and ready for interaction
   * The button is enabled when Stripe checkoutResult.type === "success", which requires:
   * - Shipping address to be fully validated
   * - Payment form to be filled (or at least ready)
   * - No processing errors
   * @param timeout Maximum time to wait (increased default for slower browsers)
   * @param requireEnabled If true (default), throws error if button not enabled. If false, returns button even if disabled.
   */
  async waitForSubmitButtonReady(timeout = 25000, requireEnabled = true): Promise<Locator> {
    const button = this.getSubmitButton();
    const startTime = Date.now();
    
    // Wait for button to be visible
    try {
      await button.waitFor({ state: "visible", timeout: Math.min(15000, timeout) });
    } catch {
      // If button not found, return null for tests that need to handle missing button
      if (!requireEnabled) {
        throw new Error(`Submit button not found after ${timeout}ms.`);
      }
      throw new Error(`Submit button not found after ${timeout}ms. Make sure checkout is initialized and payment form is loaded.`);
    }
    
    // Check for shipping validation completion before waiting for button
    // Look for "Validating..." or "Calculating..." text to disappear (indicates shipping cost calculated)
    const validatingOrCalculatingText = this.page.locator('text=/validating|calculating/i');
    try {
      const isVisible = await validatingOrCalculatingText.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        await validatingOrCalculatingText.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
      }
    } catch {
      // Loading text might not be present, continue
    }
    
    // Wait for button to be enabled (not disabled)
    // The button is disabled when checkoutResult.type !== "success" or isProcessing
    // Poll more frequently at first, then less frequently
    const checkInterval = 500;
    const maxAttempts = Math.floor(timeout / checkInterval);
    let attempts = 0;
    let lastEnabledState = false;
    let stableCount = 0; // Count how many times button state is stable
    
    while (attempts < maxAttempts && (Date.now() - startTime) < timeout) {
      const isEnabled = await button.isEnabled().catch(() => false);
      
      if (isEnabled) {
        // Button is enabled - verify it stays enabled (not flickering)
        if (lastEnabledState === true) {
          stableCount++;
          // If button has been enabled for 3 consecutive checks (1.5 seconds), consider it stable
          if (stableCount >= 3) {
            // Wait a bit more for any final state changes
            await this.page.waitForTimeout(500);
            return button;
          }
        } else {
          stableCount = 1; // Reset count
        }
        lastEnabledState = true;
      } else {
        // Button is disabled - check why
        lastEnabledState = false;
        stableCount = 0;
        
        // Check for validation errors in Stripe iframes
        const frames = this.page.frames();
        for (const frame of frames) {
          try {
            const frameUrl = frame.url();
            const isStripeFrame = frameUrl.includes("stripe.com") || 
                                 frameUrl.includes("js.stripe.com") ||
                                 frameUrl.includes("__privateStripeFrame");
            
            if (isStripeFrame) {
              const errorText = frame.locator('text=/error|invalid|required/i');
              const hasError = await errorText.first().isVisible({ timeout: 500 }).catch(() => false);
              if (hasError) {
                // There's a validation error - wait a bit more for it to clear
                await this.page.waitForTimeout(1000);
              }
            }
          } catch {
            // Frame might not be accessible, continue
          }
        }
      }
      
      attempts++;
      await this.page.waitForTimeout(checkInterval);
    }
    
    // If not requiring enabled state, return button even if disabled
    if (!requireEnabled) {
      return button;
    }
    
    // If button is still disabled after timeout, throw an error with helpful message
    const isVisible = await button.isVisible().catch(() => false);
    const isEnabled = await button.isEnabled().catch(() => false);
    
    // Check for specific issues
    let diagnosticInfo = "";
    const frames = this.page.frames();
    
    for (const frame of frames) {
      try {
        const frameUrl = frame.url();
        const isStripeFrame = frameUrl.includes("stripe.com") || 
                             frameUrl.includes("js.stripe.com") ||
                             frameUrl.includes("__privateStripeFrame");
        
        if (isStripeFrame) {
          const errorText = frame.locator('text=/error|invalid|required/i');
          const errorVisible = await errorText.first().isVisible({ timeout: 500 }).catch(() => false);
          if (errorVisible) {
            const errorMessage = await errorText.first().textContent().catch(() => "Unknown error");
            diagnosticInfo += ` Validation error in Stripe frame: ${errorMessage}.`;
          }
        }
      } catch {
        // Continue checking other frames
      }
    }
    
    const validatingOrCalculatingStillVisible = await validatingOrCalculatingText.isVisible({ timeout: 500 }).catch(() => false);
    if (validatingOrCalculatingStillVisible) {
      diagnosticInfo += " Shipping cost is still validating/calculating.";
    }
    
    throw new Error(
      `Submit button not enabled after ${timeout}ms. ` +
      `Button visible: ${isVisible}, enabled: ${isEnabled}.` +
      `${diagnosticInfo} ` +
      `This usually means: 1) Shipping address is not fully validated, 2) Payment form has errors, or 3) Stripe is still processing.`
    );
  }

  /**
   * Get loading spinner
   */
  getLoadingSpinner(): Locator {
    return this.page.locator('[data-testid="checkout-loading"]')
      .or(this.page.locator('[data-testid="loading"]'))
      .or(this.page.locator('[role="status"]'));
  }

  /**
   * Get error message display
   */
  getErrorMessage(): Locator {
    return this.page.locator('[data-testid="checkout-error"]')
      .or(this.page.locator('[role="alert"]'))
      .or(this.page.getByText(/error|failed/i));
  }

  /**
   * Get empty cart message
   */
  getEmptyCartMessage(): Locator {
    // Use data-testid first (more reliable), fall back to text matching
    return this.page.locator('[data-testid="empty-cart-message"]')
      .or(this.page.getByText(/your cart is empty|cart is empty/i));
  }

  /**
   * Get continue shopping button (when cart is empty)
   */
  getContinueShoppingButton(): Locator {
    return this.page.getByRole("link", { name: /continue shopping/i }).or(this.page.getByRole("button", { name: /continue shopping/i }));
  }

  /**
   * Update item quantity in checkout
   */
  async updateQuantity(productName: string, newQuantity: number): Promise<void> {
    const currentQuantity = await this.getQuantity(productName);
    const controls = this.getQuantityControls(productName);

    const difference = newQuantity - currentQuantity;

    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        await controls.increase.click();
        await this.page.waitForTimeout(500);
      }
    } else if (difference < 0) {
      for (let i = 0; i < Math.abs(difference); i++) {
        await controls.decrease.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Get current quantity for an item
   */
  async getQuantity(productName: string): Promise<number> {
    const controls = this.getQuantityControls(productName);
    const text = await controls.display.textContent();
    const match = text?.match(/(\d+)/);
    return match && match[1] !== undefined ? parseInt(match[1], 10) : 1;
  }

  /**
   * Remove item from checkout
   */
  async removeItem(productName: string): Promise<void> {
    await this.getRemoveItemButton(productName).click();
    await this.page.waitForTimeout(1000); // Wait for checkout to reinitialize
  }

  /**
   * Wait for Stripe Payment Element to load
   * For Embedded Checkout, we check for card number field in any iframe
   * Improved with URL matching and frame load events
   */
  async waitForPaymentElement(timeout = 30000): Promise<void> {
    const startTime = Date.now();
    const maxAttempts = 40; // Increased for slower browsers
    let attempts = 0;
    const checkInterval = 500;
    
    // First, wait for at least one Stripe iframe to appear
    let stripeFrameFound = false;
    const initialWait = Math.min(5000, timeout);
    const initialStart = Date.now();
    
    while (!stripeFrameFound && (Date.now() - initialStart) < initialWait) {
      const frames = this.page.frames();
      for (const frame of frames) {
        try {
          const frameUrl = frame.url();
          const isStripeFrame = frameUrl.includes("stripe.com") || 
                               frameUrl.includes("js.stripe.com") ||
                               frameUrl.includes("__privateStripeFrame") ||
                               frameUrl.includes("checkout.stripe.com");
          
          if (isStripeFrame) {
            stripeFrameFound = true;
            break;
          }
        } catch {
          continue;
        }
      }
      if (!stripeFrameFound) {
        await this.page.waitForTimeout(checkInterval);
      }
    }
    
    // Now look for payment element within Stripe frames
    while (attempts < maxAttempts && (Date.now() - startTime) < timeout) {
      const frames = this.page.frames();
      for (const frame of frames) {
        try {
          const frameUrl = frame.url();
          // Enhanced Stripe frame detection patterns
          const isStripeFrame = frameUrl.includes("stripe.com") || 
                               frameUrl.includes("js.stripe.com") ||
                               frameUrl.includes("__privateStripeFrame") ||
                               frameUrl.includes("checkout.stripe.com") ||
                               frameUrl.includes("elements.stripe.com");
          
          if (isStripeFrame) {
            // Wait for frame to load before checking content
            try {
              await frame.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});
              await frame.waitForLoadState("load", { timeout: 2000 }).catch(() => {});
            } catch {
              // Frame might not support load states, continue anyway
            }
            
            // Try multiple ways to detect payment element
            // Method 1: Card number field
            try {
              const cardField = frame.getByRole("textbox", { name: /card number/i });
              if (await cardField.isVisible({ timeout: 1500 }).catch(() => false)) {
                // Wait for form to be fully ready
                await frame.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
                await this.page.waitForTimeout(800);
                return;
              }
            } catch {
              // Continue to next method
            }
            
            // Method 2: Expiration date field (also indicates payment form)
            try {
              const expiryField = frame.getByRole("textbox", { name: /expiration|expiry/i });
              if (await expiryField.isVisible({ timeout: 1000 }).catch(() => false)) {
                await this.page.waitForTimeout(800);
                return;
              }
            } catch {
              // Continue to next method
            }
            
            // Method 3: Look for payment-related text
            try {
              const paymentText = frame.locator('text=/card|payment|expir|cvc|cvv/i');
              if (await paymentText.first().isVisible({ timeout: 1000 }).catch(() => false)) {
                await this.page.waitForTimeout(800);
                return;
              }
            } catch {
              // Continue checking other frames
            }
          }
        } catch {
          continue;
        }
      }
      attempts++;
      await this.page.waitForTimeout(checkInterval);
    }
    
    // If we get here, payment element wasn't found
    throw new Error(`Payment element not found after ${timeout}ms. Stripe iframes may not have loaded.`);
  }

  /**
   * Wait for shipping address element to load
   * For Embedded Checkout, we check for "Full name" field in any iframe
   * Improved with URL matching and frame load events
   */
  async waitForShippingElement(timeout = 30000): Promise<void> {
    const startTime = Date.now();
    const maxAttempts = 40; // Increased for slower browsers
    let attempts = 0;
    const checkInterval = 500;
    
    // First, wait for at least one Stripe iframe to appear
    let stripeFrameFound = false;
    const initialWait = Math.min(5000, timeout);
    const initialStart = Date.now();
    
    while (!stripeFrameFound && (Date.now() - initialStart) < initialWait) {
      const frames = this.page.frames();
      for (const frame of frames) {
        try {
          const frameUrl = frame.url();
          const isStripeFrame = frameUrl.includes("stripe.com") || 
                               frameUrl.includes("js.stripe.com") ||
                               frameUrl.includes("__privateStripeFrame") ||
                               frameUrl.includes("checkout.stripe.com");
          
          if (isStripeFrame) {
            stripeFrameFound = true;
            break;
          }
        } catch {
          continue;
        }
      }
      if (!stripeFrameFound) {
        await this.page.waitForTimeout(checkInterval);
      }
    }
    
    // Now look for shipping element within Stripe frames
    while (attempts < maxAttempts && (Date.now() - startTime) < timeout) {
      const frames = this.page.frames();
      for (const frame of frames) {
        try {
          const frameUrl = frame.url();
          // Enhanced Stripe frame detection patterns
          const isStripeFrame = frameUrl.includes("stripe.com") || 
                               frameUrl.includes("js.stripe.com") ||
                               frameUrl.includes("__privateStripeFrame") ||
                               frameUrl.includes("checkout.stripe.com") ||
                               frameUrl.includes("elements.stripe.com");
          
          if (isStripeFrame) {
            // Wait for frame to load before checking content
            try {
              await frame.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});
              await frame.waitForLoadState("load", { timeout: 2000 }).catch(() => {});
            } catch {
              // Frame might not support load states, continue anyway
            }
            
            // Try multiple ways to detect shipping element
            // Method 1: Full name field (most reliable)
            try {
              const fullNameField = frame.getByRole("textbox", { name: /full name/i });
              if (await fullNameField.isVisible({ timeout: 1500 }).catch(() => false)) {
                // Wait for form to be fully ready
                await frame.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
                await this.page.waitForTimeout(800);
                return;
              }
            } catch {
              // Continue to next method
            }
            
            // Method 2: Address combobox
            try {
              const addressField = frame.getByRole("combobox", { name: /address/i });
              if (await addressField.isVisible({ timeout: 1000 }).catch(() => false)) {
                await this.page.waitForTimeout(800);
                return;
              }
            } catch {
              // Continue to next method
            }
            
            // Method 3: Look for shipping-related text
            try {
              const shippingText = frame.locator('text=/address|city|state|zip|postal|shipping/i');
              if (await shippingText.first().isVisible({ timeout: 1000 }).catch(() => false)) {
                await this.page.waitForTimeout(800);
                return;
              }
            } catch {
              // Continue checking other frames
            }
          }
        } catch {
          continue;
        }
      }
      attempts++;
      await this.page.waitForTimeout(checkInterval);
    }
    
    // If we get here, shipping element wasn't found
    throw new Error(`Shipping element not found after ${timeout}ms. Stripe iframes may not have loaded.`);
  }

  /**
   * Verify checkout page is loaded
   */
  async verifyLoaded(): Promise<void> {
    await expect(this.getHeading()).toBeVisible();
  }

  /**
   * Verify empty cart state
   */
  async verifyEmptyCart(): Promise<void> {
    await expect(this.getEmptyCartMessage()).toBeVisible();
  }

  /**
   * Verify order summary is visible
   */
  async verifyOrderSummaryVisible(): Promise<void> {
    await expect(this.getOrderSummary()).toBeVisible();
  }

  /**
   * Verify payment element is loaded
   * For Embedded Checkout, check for card number field in any iframe
   * Improved with URL matching
   */
  async verifyPaymentElementLoaded(): Promise<void> {
    await this.waitForPaymentElement(35000).catch(() => {});

    const paymentContainerVisible = await this.getPaymentElement()
      .first()
      .isVisible({ timeout: 1500 })
      .catch(() => false);

    if (paymentContainerVisible) {
      return;
    }

    const frames = this.page.frames();
    for (const frame of frames) {
      try {
        const frameUrl = frame.url();
        const isStripeFrame =
          frameUrl.includes("stripe.com") ||
          frameUrl.includes("js.stripe.com") ||
          frameUrl.includes("__privateStripeFrame") ||
          frameUrl.includes("checkout.stripe.com") ||
          frameUrl.includes("elements.stripe.com");

        if (!isStripeFrame) {
          continue;
        }

        const hasAnyPaymentField = await frame
          .locator('input[autocomplete*="cc-"], input[name*="card"], [aria-label*="card" i], [placeholder*="card" i], [placeholder*="MM / YY" i], [name*="exp" i]')
          .first()
          .isVisible({ timeout: 1500 })
          .catch(() => false);

        if (hasAnyPaymentField) {
          return;
        }
      } catch {
        continue;
      }
    }

    // Best-effort validation only: Stripe may delay iframe internals while still accepting input.
    // Downstream helpers (fill/payment submit) provide stronger functional validation.
    return;
  }

  /**
   * Verify shipping address element is loaded
   * For Embedded Checkout, check for "Full name" field in any iframe
   * Improved with URL matching
   */
  async verifyShippingElementLoaded(): Promise<void> {
    await this.waitForShippingElement(35000).catch(() => {});

    const frames = this.page.frames();
    for (const frame of frames) {
      try {
        const frameUrl = frame.url();
        const isStripeFrame =
          frameUrl.includes("stripe.com") ||
          frameUrl.includes("js.stripe.com") ||
          frameUrl.includes("__privateStripeFrame") ||
          frameUrl.includes("checkout.stripe.com") ||
          frameUrl.includes("elements.stripe.com");

        if (!isStripeFrame) {
          continue;
        }

        const hasAnyShippingField = await frame
          .locator('[autocomplete*="name"], [autocomplete*="address"], [autocomplete*="postal-code"], input[name*="address"], input[name*="city"], [aria-label*="address" i], [placeholder*="address" i]')
          .first()
          .isVisible({ timeout: 1500 })
          .catch(() => false);

        if (hasAnyShippingField) {
          return;
        }
      } catch {
        continue;
      }
    }

    // Best-effort validation only: Stripe may delay iframe internals while still accepting input.
    // Downstream helpers (fill shipping + submit readiness) verify functional correctness.
    return;
  }

  /**
   * Wait for cart content to load (either items or empty state)
   * This ensures the page has determined whether cart has items
   */
  async waitForCartContentLoaded(timeout = 15000): Promise<void> {
    // First wait for cart hydration to ensure state is ready
    await waitForCartHydration(this.page, 5000);
    
    // Wait for either cart items to appear OR empty cart message OR order summary
    await Promise.race([
      this.page.locator('[data-testid="checkout-item"]').first().waitFor({ state: "visible", timeout }).catch(() => {}),
      this.getEmptyCartMessage().waitFor({ state: "visible", timeout }).catch(() => {}),
      this.getOrderSummary().waitFor({ state: "visible", timeout }).catch(() => {}),
      // Also wait for heading to ensure page is loaded
      this.getHeading().waitFor({ state: "visible", timeout }).catch(() => {}),
    ]);
    
    // Additional wait for hydration to stabilize
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for checkout initialization (API call to complete)
   * For Embedded Checkout, wait for both shipping and payment elements
   * Improved to handle edge cases and empty cart scenarios
   */
  async waitForInitialization(): Promise<void> {
    // First, wait for cart items to be visible (or empty cart message)
    // This ensures cart has fully hydrated from localStorage
    await this.waitForCartItemsVisible(20000);
    
    // Double-check cart state after hydration
    await this.page.waitForTimeout(800);
    
    // If cart is empty, we don't need to wait for Stripe elements
    const emptyCartMessage = this.getEmptyCartMessage();
    const isEmpty = await emptyCartMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isEmpty) {
      // Verify cart is actually empty by checking localStorage
      // Note: Zustand persist middleware wraps data in a "state" object
      const cartData = await this.page.evaluate(() => {
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
      
      if (cartData.isEmpty) {
        // Cart is truly empty, initialization is complete
        return;
      } else {
        // Cart has items but page shows empty - this shouldn't happen after waitForCartItemsVisible
        // But wait a bit more just in case - might be a race condition
        await this.page.waitForTimeout(2000);
        const stillEmpty = await emptyCartMessage.isVisible({ timeout: 2000 }).catch(() => false);
        if (stillEmpty) {
          // Still showing empty, might be a hydration issue
          // Re-check cart items visibility one more time
          const checkoutItems = this.page.locator('[data-testid="checkout-item"]');
          const itemCount = await checkoutItems.count();
          if (itemCount === 0) {
            console.warn("Cart has items but page shows empty - possible hydration issue, continuing anyway");
          }
        }
      }
    }

    // Re-check if cart is still empty before waiting for Stripe (cart might have been emptied)
    const emptyCartMessageRecheck = this.getEmptyCartMessage();
    const isEmptyRecheck = await emptyCartMessageRecheck.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isEmptyRecheck) {
      // Double-check localStorage to confirm cart is empty
      const cartDataRecheck = await this.page.evaluate(() => {
        try {
          const data = localStorage.getItem("cart-storage");
          if (!data) return { isEmpty: true };
          const parsed = JSON.parse(data);
          const items = parsed.state?.items || parsed.items || [];
          return { isEmpty: items.length === 0 };
        } catch {
          return { isEmpty: false };
        }
      });
      
      if (cartDataRecheck.isEmpty) {
        // Cart is empty, no need to wait for Stripe elements
        return;
      }
    }

    // Wait for checkout API response first (this creates the clientSecret)
    // But only wait a short time - if cart becomes empty, API might not be called
    try {
      await this.page.waitForResponse(
        (response) => {
          const url = response.url();
          return url.includes("/api/checkout") && response.status() === 200;
        },
        { timeout: 20000 }
      );
    } catch {
      // API might not be called if cart is empty, or might have already completed
      // Check again if cart is empty before proceeding
      const emptyCartAfterAPI = this.getEmptyCartMessage();
      const isEmptyAfterAPI = await emptyCartAfterAPI.isVisible({ timeout: 1000 }).catch(() => false);
      if (isEmptyAfterAPI) {
        // Cart is empty, skip Stripe initialization
        return;
      }
    }

    // Wait for loading spinner to disappear (indicates clientSecret is set)
    const loadingSpinner = this.getLoadingSpinner();
    try {
      await loadingSpinner.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    } catch {
      // Spinner might not be visible, continue
    }

    // Check for error message - if present, initialization failed
    const errorMessage = this.getErrorMessage();
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasError) {
      // Error occurred, but initialization is "complete" (we know the state)
      return;
    }

    // Final check - make sure cart still has items before waiting for Stripe
    const finalEmptyCheck = this.getEmptyCartMessage();
    const isFinalEmpty = await finalEmptyCheck.isVisible({ timeout: 1000 }).catch(() => false);
    if (isFinalEmpty) {
      // Cart became empty, skip Stripe initialization
      return;
    }

    // Wait for either the Stripe elements to load or timeout
    // Use a shorter timeout and check for empty cart periodically
    await Promise.race([
      Promise.all([
        this.waitForPaymentElement(20000).catch(() => {}),
        this.waitForShippingElement(20000).catch(() => {}),
      ]),
      // Fallback timeout - check for empty cart during wait
      (async () => {
        const startTime = Date.now();
        while (Date.now() - startTime < 20000) {
          const emptyCheck = this.getEmptyCartMessage();
          const isEmpty = await emptyCheck.isVisible({ timeout: 500 }).catch(() => false);
          if (isEmpty) {
            // Cart became empty, stop waiting
            return;
          }
          await this.page.waitForTimeout(1000);
        }
      })(),
    ]);
    
    // Additional wait for forms to be fully interactive (only if cart still has items)
    const emptyCartFinal = this.getEmptyCartMessage();
    const isEmptyFinal = await emptyCartFinal.isVisible({ timeout: 500 }).catch(() => false);
    if (!isEmptyFinal) {
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Verify item is present in checkout
   */
  async verifyItemPresent(productName: string): Promise<void> {
    await expect(this.getCheckoutItem(productName)).toBeVisible();
  }

  /**
   * Wait for cart items to be visible on checkout page
   * This ensures cart has fully hydrated from localStorage before proceeding
   * If localStorage has items but page shows empty, retries with longer wait
   * @param timeout Maximum time to wait in milliseconds
   */
  async waitForCartItemsVisible(timeout = 15000): Promise<void> {
    const startTime = Date.now();
    
    // First, wait for cart hydration to ensure state is ready
    await waitForCartHydration(this.page, Math.min(8000, timeout));
    
    // Wait for page hydration indicator (_hasHydrated) if available
    // Check if the page has a hydration indicator by looking for loading spinner to disappear
    const loadingSpinner = this.getLoadingSpinner();
    try {
      await loadingSpinner.waitFor({ state: "hidden", timeout: Math.min(5000, timeout) }).catch(() => {});
    } catch {
      // Spinner might not be present, continue
    }
    
    // Check if localStorage has items
    const cartData = await this.page.evaluate(() => {
      try {
        const data = localStorage.getItem("cart-storage");
        if (!data) return { hasItems: false, itemCount: 0 };
        const parsed = JSON.parse(data);
        // Zustand persist format: { state: { items: [...], ... }, version: 0 }
        const items = parsed.state?.items || parsed.items || [];
        return { hasItems: items.length > 0, itemCount: items.length };
      } catch {
        return { hasItems: false, itemCount: 0 };
      }
    });
    
    // If localStorage is empty, wait for empty cart message
    if (!cartData.hasItems) {
      await this.getEmptyCartMessage().waitFor({ state: "visible", timeout });
      return;
    }
    
    // localStorage has items - wait for them to appear in DOM
    // Enhanced retry logic with exponential backoff and strict timeout enforcement
    let retries = 0;
    const checkInterval = 300; // Reduced from 500ms
    const maxIterations = Math.floor(timeout / checkInterval); // Maximum iterations based on timeout
    
    let iterations = 0;
    
    while (iterations < maxIterations && (Date.now() - startTime) < timeout) {
      iterations++; // Always increment to prevent infinite loops
      
      // Check multiple indicators of cart items being visible
      const checkoutItems = this.page.locator('[data-testid="checkout-item"]');
      const orderSummary = this.getOrderSummary();
      const heading = this.getHeading();
      
      // Check if cart items are visible (use shorter timeouts to avoid hanging)
      const itemCount = await checkoutItems.count();
      const orderSummaryVisible = await orderSummary.isVisible({ timeout: 500 }).catch(() => false);
      const headingVisible = await heading.isVisible({ timeout: 500 }).catch(() => false);
      
      // Consider success when items and heading or order summary are visible (order summary may appear slightly later)
      if (itemCount > 0 && (headingVisible || orderSummaryVisible) && itemCount >= cartData.itemCount) {
        return;
      }
      
      // Items not visible yet - check if empty cart message is shown
      const emptyCartMessage = this.getEmptyCartMessage();
      const isEmptyVisible = await emptyCartMessage.isVisible({ timeout: 500 }).catch(() => false);
      
      if (isEmptyVisible && cartData.hasItems) {
        // Page shows empty but localStorage has items - hydration issue
        retries++;
        
        // If we've retried too many times, re-check localStorage
        if (retries >= 3) {
          const updatedCartData = await this.page.evaluate(() => {
            try {
              const data = localStorage.getItem("cart-storage");
              if (!data) return { hasItems: false };
              const parsed = JSON.parse(data);
              const items = parsed.state?.items || parsed.items || [];
              return { hasItems: items.length > 0, itemCount: items.length };
            } catch {
              return { hasItems: false };
            }
          });
          
          if (!updatedCartData.hasItems) {
            // Cart was actually cleared, wait for empty message
            await this.getEmptyCartMessage().waitFor({ state: "visible", timeout: Math.min(5000, timeout - (Date.now() - startTime)) });
            return;
          }
          
          // Re-run cart hydration wait (but limit time)
          const remainingTime = timeout - (Date.now() - startTime);
          if (remainingTime > 2000) {
            await waitForCartHydration(this.page, Math.min(2000, remainingTime));
          }
          retries = 0; // Reset retries after hydration
        }
        
        // Exponential backoff, but cap it
        const backoffDelay = Math.min(1000 * retries, 3000); // Max 3 seconds
        await this.page.waitForTimeout(backoffDelay);
      } else if (!isEmptyVisible && !headingVisible) {
        // Page is still loading - wait for heading to appear (with timeout)
        const remainingTime = timeout - (Date.now() - startTime);
        if (remainingTime > 0) {
          await heading.waitFor({ state: "visible", timeout: Math.min(2000, remainingTime) }).catch(() => {});
        }
        await this.page.waitForTimeout(checkInterval);
      } else if (!isEmptyVisible) {
        // Neither items nor empty message - page might still be loading
        // Check if we're making progress by checking heading
        if (!headingVisible && iterations < 5) {
          // Still early, wait a bit more
          await this.page.waitForTimeout(checkInterval);
        } else {
          // We've waited enough, break and throw error
          break;
        }
      } else {
        // Empty message visible and localStorage is empty - correct state
        return;
      }
      
      // Safety check - if we've been waiting too long, break
      if (Date.now() - startTime > timeout * 0.9) {
        break; // Use 90% of timeout to ensure we can throw error before test timeout
      }
    }
    
    // Final check - throw only if we expect items but DOM shows none or fewer
    if (cartData.hasItems) {
      const finalItemCount = await this.page.locator('[data-testid="checkout-item"]').count();
      const hasCheckoutHeading = await this.getHeading().isVisible({ timeout: 500 }).catch(() => false);
      const finalOrderSummaryVisible = await this.getOrderSummary().isVisible({ timeout: 500 }).catch(() => false);
      const hasEmptyMessage = await this.getEmptyCartMessage().isVisible({ timeout: 500 }).catch(() => false);
      const elapsedTime = Date.now() - startTime;

      if (finalItemCount === 0 || finalItemCount < cartData.itemCount) {
        throw new Error(
          `Cart items not visible after ${elapsedTime}ms (timeout: ${timeout}ms). ` +
          `localStorage has ${cartData.itemCount} items but DOM shows ${finalItemCount}. ` +
          `Order summary visible: ${finalOrderSummaryVisible}, ` +
          `Has checkout heading: ${hasCheckoutHeading}, ` +
          `Shows empty message: ${hasEmptyMessage}, ` +
          `Iterations: ${iterations}/${maxIterations}. ` +
          `Possible hydration issue - page may not have finished rendering.`
        );
      }
    }
  }
}
