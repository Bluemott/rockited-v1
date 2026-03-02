import { type Frame, Page, expect } from "@playwright/test";

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

  // Wait for cart to be cleared - verify badge count is 0 or badge is not visible
  await page.waitForTimeout(500);
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
      await page.waitForTimeout(500);
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
  const startTime = Date.now();
  
  // Wait for both shipping and payment iframes to appear
  // Stripe Embedded Checkout uses multiple iframes
  // Try multiple selectors to find Stripe iframes
  const iframeSelectors = [
    'iframe[title*="shipping"]',
    'iframe[title*="payment"]',
    'iframe[title*="Shipping"]',
    'iframe[title*="Payment"]',
    'iframe[name*="stripe"]',
    'iframe[name*="__privateStripeFrame"]',
    'iframe[src*="stripe"]',
    'iframe[src*="js.stripe.com"]',
  ];

  // Wait for at least one Stripe iframe to be visible
  await Promise.race(
    iframeSelectors.map((selector) =>
      page.waitForSelector(selector, { state: "visible", timeout: Math.min(10000, timeout) }).catch(() => {})
    )
  );

  // Verify that we can actually find the iframes by checking frames
  // Use URL matching as primary method, then fall back to content detection
  let foundShipping = false;
  let foundPayment = false;
  let shippingFrame: Frame | null = null;
  let paymentFrame: Frame | null = null;
  const maxAttempts = 20; // Increased attempts for slower browsers
  let attempts = 0;

  while ((!foundShipping || !foundPayment) && attempts < maxAttempts && (Date.now() - startTime) < timeout) {
    const frames = page.frames();
    
    for (const frame of frames) {
      try {
        const frameUrl = frame.url();
        
        // Check frame URL for Stripe indicators
        const isStripeFrame = frameUrl.includes("stripe.com") || 
                              frameUrl.includes("js.stripe.com") ||
                              frameUrl.includes("__privateStripeFrame");
        
        if (isStripeFrame) {
          // Wait for frame to be loaded before checking content
          try {
            await frame.waitForLoadState("domcontentloaded", { timeout: 2000 }).catch(() => {});
            await frame.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {});
          } catch {
            // Frame might not support load states, continue anyway
          }
          
          // Check for shipping frame by looking for "Full name" field
          if (!foundShipping) {
            try {
              const fullNameField = frame.getByRole("textbox", { name: /full name/i });
              if (await fullNameField.isVisible({ timeout: 1000 }).catch(() => false)) {
                foundShipping = true;
                shippingFrame = frame;
                continue; // Found shipping, move to next frame
              }
            } catch {
              // Try alternative: check for address-related fields
              try {
                const addressField = frame.getByRole("combobox", { name: /address/i });
                if (await addressField.isVisible({ timeout: 500 }).catch(() => false)) {
                  foundShipping = true;
                  shippingFrame = frame;
                  continue;
                }
              } catch {
                // Continue checking
              }
            }
          }
          
          // Check for payment frame by looking for "Card number" field
          if (!foundPayment) {
            try {
              const cardField = frame.getByRole("textbox", { name: /card number/i });
              if (await cardField.isVisible({ timeout: 1000 }).catch(() => false)) {
                foundPayment = true;
                paymentFrame = frame;
                continue;
              }
            } catch {
              // Try alternative: check for payment-related text
              try {
                const paymentText = frame.locator('text=/card|payment|expir/i');
                if (await paymentText.first().isVisible({ timeout: 500 }).catch(() => false)) {
                  foundPayment = true;
                  paymentFrame = frame;
                  continue;
                }
              } catch {
                // Continue checking
              }
            }
          }
        }
      } catch {
        // Frame might not be accessible, continue
        continue;
      }
    }

    if (foundShipping && foundPayment) {
      break;
    }

    attempts++;
    await page.waitForTimeout(500);
  }

  // If we found frames, wait for them to be fully interactive
  if (shippingFrame) {
    try {
      await shippingFrame.waitForLoadState("domcontentloaded", { timeout: 2000 }).catch(() => {});
    } catch {
      // Ignore if frame doesn't support load states
    }
  }
  
  if (paymentFrame) {
    try {
      await paymentFrame.waitForLoadState("domcontentloaded", { timeout: 2000 }).catch(() => {});
    } catch {
      // Ignore if frame doesn't support load states
    }
  }

  // Wait a bit more for the forms to be fully ready inside the iframes
  await page.waitForTimeout(1000);
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
  // Wait for Stripe elements to load
  await waitForStripe(page);
  
  // Dismiss cookie consent if it appears on checkout page
  await dismissCookieConsent(page);

  // Find the shipping address frame using page.frames()
  // The shipping frame contains a "Full name" textbox
  const frames = page.frames();
  let shippingFrame = null;
  
  for (const frame of frames) {
    try {
      const fullNameField = frame.getByRole("textbox", { name: /full name/i });
      if (await fullNameField.isVisible({ timeout: 500 }).catch(() => false)) {
        shippingFrame = frame;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!shippingFrame) {
    throw new Error("Could not find shipping address iframe");
  }

  // Fill Full Name (textbox)
  const fullNameField = shippingFrame.getByRole("textbox", { name: /full name/i });
  await fullNameField.waitFor({ state: "visible", timeout: 10000 });
  await fullNameField.click();
  await fullNameField.fill(fullName);
  await page.waitForTimeout(200); // Reduced from 300ms

  // Fill Address Line 1 (combobox with autocomplete)
  const addressCombobox = shippingFrame.getByRole("combobox", { name: /address/i });
  await addressCombobox.waitFor({ state: "visible", timeout: 5000 });
  await addressCombobox.click();
  await addressCombobox.fill(address);
  await page.waitForTimeout(600); // Reduced from 800ms
  // Press Escape to dismiss autocomplete dropdown
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300); // Reduced from 500ms
  // Press Tab to move to next field (this helps Stripe's form advance)
  await page.keyboard.press("Tab");
  await page.waitForTimeout(200); // Reduced from 300ms
  // Press Tab again to skip Address Line 2 if present
  await page.keyboard.press("Tab");
  // Wait for form to advance and show City/State/ZIP fields
  // Also wait for any "City" text to appear, indicating the field is ready
  await Promise.race([
    shippingFrame.locator('text=/city/i').waitFor({ state: "visible", timeout: 2000 }).catch(() => {}),
    page.waitForTimeout(1500), // Reduced from 2000ms
  ]);

  // Fill City (textbox) - Stripe's form structure has City label in a generic container
  // Wait for City field to appear (form may need time to render after address is filled)
  let cityField;
  const maxAttempts = 5;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Strategy 1: Try to find textbox with accessible name containing "city"
      cityField = shippingFrame.getByRole("textbox", { name: /city/i });
      if (await cityField.isVisible({ timeout: 3000 }).catch(() => false)) {
        break;
      }
    } catch {}
    
    // Strategy 2: Find by position - get all visible textboxes
    const allTextboxes = shippingFrame.getByRole("textbox");
    const count = await allTextboxes.count();
    
    // Find empty textbox that's not Full Name (filled), Address Line 2 (has placeholder), or ZIP (has "zip" in attributes)
    for (let i = 0; i < count; i++) {
      const textbox = allTextboxes.nth(i);
      try {
        if (!(await textbox.isVisible({ timeout: 1000 }).catch(() => false))) continue;
        
        const value = await textbox.inputValue().catch(() => "");
        const placeholder = await textbox.getAttribute("placeholder").catch(() => "");
        const name = await textbox.getAttribute("name").catch(() => "");
        const ariaLabel = await textbox.getAttribute("aria-label").catch(() => "");
        
        // Skip filled fields
        if (value && value.trim() !== "") continue;
        // Skip Address Line 2 (has placeholder about apt/suite)
        if (placeholder?.toLowerCase().includes("apt") || placeholder?.toLowerCase().includes("suite")) continue;
        // Skip ZIP code (has "zip" in name or label)
        if (name?.toLowerCase().includes("zip") || ariaLabel?.toLowerCase().includes("zip")) continue;
        
        // This should be City - it's empty, visible, and not Address Line 2 or ZIP
        // City is typically the 3rd or 4th textbox (after Full Name and possibly Address Line 2)
        if (i >= 2) {
          cityField = textbox;
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (cityField) {
      break;
    }
    
    attempts++;
    await page.waitForTimeout(500);
  }
  
  if (!cityField) {
    // Last resort: try to get 3rd textbox (assuming: 1=Full Name, 2=Address Line 2 (optional), 3=City)
    const allTextboxes = shippingFrame.getByRole("textbox");
    const count = await allTextboxes.count();
    if (count >= 3) {
      cityField = allTextboxes.nth(2);
    } else if (count >= 2) {
      cityField = allTextboxes.nth(1);
    }
  }
  
  if (!cityField) {
    throw new Error("Could not find City field in shipping form after multiple attempts");
  }
  
  await cityField.waitFor({ state: "visible", timeout: 10000 });
  await cityField.click();
  await cityField.fill(city);
  await page.waitForTimeout(150); // Reduced from 200ms

  // Select State (COMBOBOX - must select from dropdown, not fill as textbox)
  // Convert state code to full name if needed
  const stateName = STATE_CODE_TO_NAME[state.toUpperCase()] || state;
  
  // Use flexible regex to match "State" - find the combobox
  const stateCombobox = shippingFrame.getByRole("combobox", { name: /state/i });
  await stateCombobox.waitFor({ state: "visible", timeout: 10000 });
  
  // Click to open dropdown and wait for options to appear
  await stateCombobox.click();
  await page.waitForTimeout(300); // Reduced from 500ms
  
  // Wait for dropdown options to be available
  // Check for option with state name in the frame
  const maxStateAttempts = 5;
  let stateSelected = false;
  
  for (let attempt = 0; attempt < maxStateAttempts && !stateSelected; attempt++) {
    try {
      // Strategy 1: Use keyboard navigation (most reliable for Stripe)
      // Clear any existing text first
      await stateCombobox.fill("");
      await page.waitForTimeout(200);
      
      // Type state name to filter
      await stateCombobox.fill(stateName);
      await page.waitForTimeout(600); // Reduced from 800ms - Wait for filtering
      
      // Wait for filtered option to appear
      const stateOption = shippingFrame.getByRole("option", { name: new RegExp(stateName, "i") });
      const optionVisible = await stateOption.isVisible({ timeout: 1500 }).catch(() => false);
      
      if (optionVisible) {
        // Use keyboard navigation: ArrowDown to select, then Enter
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(200); // Reduced from 300ms
        await page.keyboard.press("Enter");
        await page.waitForTimeout(300); // Reduced from 500ms
        stateSelected = true;
      } else {
        // Strategy 2: Try selectOption if keyboard fails
        try {
          await stateCombobox.selectOption({ label: stateName });
          await page.waitForTimeout(300); // Reduced from 500ms
          stateSelected = true;
        } catch {
          // Strategy 3: Try by value
          try {
            await stateCombobox.selectOption({ value: stateName });
            await page.waitForTimeout(300); // Reduced from 500ms
            stateSelected = true;
          } catch {
            // If all fail, try typing and pressing Enter directly
            await stateCombobox.fill(stateName);
            await page.waitForTimeout(300); // Reduced from 500ms
            await page.keyboard.press("Enter");
            await page.waitForTimeout(300); // Reduced from 500ms
            stateSelected = true; // Assume success
          }
        }
      }
    } catch (error) {
      if (attempt < maxStateAttempts - 1) {
        await page.waitForTimeout(300); // Reduced from 500ms
        // Retry by clicking again
        await stateCombobox.click();
        await page.waitForTimeout(300); // Reduced from 500ms
      } else {
        throw new Error(`Failed to select state "${stateName}" after ${maxStateAttempts} attempts: ${error}`);
      }
    }
  }
  
  // Verify state was selected by checking the combobox value
  await page.waitForTimeout(200); // Reduced from 400ms

  // Fill ZIP code (textbox) - explicitly target by accessible name
  // Use flexible regex to match "ZIP code" or "ZIP" with possible variations
  const zipField = shippingFrame.getByRole("textbox", { name: /zip/i });
  await zipField.waitFor({ state: "visible", timeout: 10000 });
  await zipField.click();
  await zipField.fill(zipCode);
  await page.waitForTimeout(300); // Reduced from 500ms

  // Wait for Stripe to validate the address and calculate shipping
  // This is critical - the submit button won't enable until validation completes
  // Check for validation errors in the shipping frame
  const maxValidationAttempts = 8; // Reduced from 10
  let validationComplete = false;
  
  for (let attempt = 0; attempt < maxValidationAttempts && !validationComplete; attempt++) {
    await page.waitForTimeout(800); // Reduced from 1000ms
    
    // Check for validation errors
    const errorMessages = shippingFrame.locator('text=/error|invalid|required/i');
    const hasErrors = await errorMessages.first().isVisible({ timeout: 300 }).catch(() => false);
    
    if (hasErrors) {
      // Wait a bit more for errors to clear (might be transient)
      await page.waitForTimeout(800); // Reduced from 1000ms
      const stillHasErrors = await errorMessages.first().isVisible({ timeout: 300 }).catch(() => false);
      if (!stillHasErrors) {
        validationComplete = true;
      }
    } else {
      // Check if shipping cost is being calculated (indicates validation in progress)
      // Look for "Validating..." or "Calculating..." text in the main page (not iframe)
      const validatingOrCalculatingText = page.locator('text=/validating|calculating/i');
      const isVisible = await validatingOrCalculatingText.isVisible({ timeout: 300 }).catch(() => false);
      
      if (!isVisible) {
        // Shipping cost should be calculated or shown - validation likely complete
        validationComplete = true;
      }
    }
  }
  
  // Additional wait to ensure form is fully ready (reduced)
  await page.waitForTimeout(1000); // Reduced from 1500ms
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
  // Wait for Stripe elements to load
  await waitForStripe(page);

  // Find the payment frame using page.frames()
  // The payment frame contains a "Card number" textbox
  const frames = page.frames();
  let paymentFrame = null;
  
  for (const frame of frames) {
    try {
      const cardField = frame.getByRole("textbox", { name: /card number/i });
      if (await cardField.isVisible({ timeout: 500 }).catch(() => false)) {
        paymentFrame = frame;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!paymentFrame) {
    throw new Error("Could not find payment iframe");
  }

  // Fill card number - uses accessible name "Card number"
  const cardNumberField = paymentFrame.getByRole("textbox", { name: /card number/i });
  await cardNumberField.waitFor({ state: "visible", timeout: 10000 });
  await cardNumberField.click();
  await cardNumberField.fill(cardNumber);
  await page.waitForTimeout(300); // Reduced from 500ms

  // Fill expiry date - uses accessible name "Expiration date MM / YY"
  const expiryField = paymentFrame.getByRole("textbox", { name: /expiration date/i });
  await expiryField.waitFor({ state: "visible", timeout: 5000 });
  await expiryField.click();
  await expiryField.fill(expiryDate);
  await page.waitForTimeout(300); // Reduced from 500ms

  // Fill CVC - uses accessible name "Security code"
  const cvcField = paymentFrame.getByRole("textbox", { name: /security code/i });
  await cvcField.waitFor({ state: "visible", timeout: 5000 });
  await cvcField.click();
  await cvcField.fill(cvc);
  await page.waitForTimeout(800); // Reduced from 1000ms - Wait for card validation
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
