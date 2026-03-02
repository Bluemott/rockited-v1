import { Page, Locator, expect } from "@playwright/test";

import { dismissCookieConsent, waitForCartHydration } from "../test-helpers";

/**
 * Page Object Model for Cart Page
 * Handles interactions with the shopping cart
 */
export class CartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to cart page
   */
  async goto(): Promise<void> {
    await this.page.goto("/cart");
    await this.page.waitForLoadState("domcontentloaded");
    await dismissCookieConsent(this.page);
    // Wait for cart hydration first - ensures cart state is ready
    await this.waitForHydration();
    // Wait for loading spinner to disappear (indicates hydration complete)
    const loadingSpinner = this.page.locator('[data-testid="loading-spinner"]').or(this.page.locator('svg[class*="animate-spin"]'));
    await loadingSpinner.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    // Wait for cart content to appear (either cart items or empty cart message)
    await Promise.race([
      this.page.locator('[data-testid="cart-item"]').first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.page.getByText(/your cart is empty|cart is empty/i).waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
    ]);
  }

  /**
   * Wait for cart store to hydrate from localStorage
   * Ensures Zustand's persist middleware has finished rehydrating before proceeding
   */
  async waitForHydration(timeout = 10000): Promise<void> {
    await waitForCartHydration(this.page, timeout);
  }

  /**
   * Get proceed to checkout button
   * Uses .first() to handle pages that have both a link and button version
   */
  getProceedToCheckoutButton(): Locator {
    return this.page.getByRole("button", { name: /proceed to checkout/i })
      .or(this.page.getByRole("link", { name: /proceed to checkout/i }))
      .first();
  }

  /**
   * Get continue shopping button/link
   */
  getContinueShoppingButton(): Locator {
    return this.page.getByRole("link", { name: /continue shopping/i }).or(this.page.getByRole("button", { name: /continue shopping/i }));
  }

  /**
   * Get cart item by product name
   */
  getCartItem(productName: string): Locator {
    // Find cart item by data-testid that contains a heading with the product name
    // This is more specific than filtering by hasText which can match parent containers
    const heading = this.page.getByRole("heading", { name: productName, level: 3 });
    return this.page
      .locator('[data-testid="cart-item"]')
      .filter({ has: heading })
      .first(); // Use first() to handle strict mode violations
  }

  /**
   * Get quantity select/combobox for a cart item
   * Cart page uses a select element for quantity
   */
  getQuantitySelect(productName: string): Locator {
    const item = this.getCartItem(productName);
    return item.getByRole("combobox").or(item.locator("select"));
  }

  /**
   * Get quantity input for a cart item (legacy - kept for compatibility)
   */
  getQuantityInput(productName: string): Locator {
    const item = this.getCartItem(productName);
    return item.locator('input[type="number"]').or(item.getByRole("spinbutton"));
  }

  /**
   * Get increase quantity button (+) - for UIs that use +/- buttons
   */
  getIncreaseQuantityButton(productName: string): Locator {
    const item = this.getCartItem(productName);
    return item.getByRole("button", { name: /\+|increase|plus/i }).or(item.locator('button:has-text("+")'));
  }

  /**
   * Get decrease quantity button (-) - for UIs that use +/- buttons
   */
  getDecreaseQuantityButton(productName: string): Locator {
    const item = this.getCartItem(productName);
    return item.getByRole("button", { name: /-|decrease|minus/i }).or(item.locator('button:has-text("-")'));
  }

  /**
   * Get remove item button
   */
  getRemoveItemButton(productName: string): Locator {
    const item = this.getCartItem(productName);
    return item.getByRole("button", { name: /remove|delete/i }).or(item.locator('button[aria-label*="remove" i]'));
  }

  /**
   * Update quantity for a product
   * Tries select dropdown first (cart page), then falls back to +/- buttons
   */
  async updateQuantity(productName: string, quantity: number): Promise<void> {
    const select = this.getQuantitySelect(productName);
    
    // Try select dropdown first (used on cart page)
    if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
      await select.selectOption(quantity.toString());
      await this.page.waitForTimeout(500);
      return;
    }
    
    // Fall back to +/- buttons
    const currentQuantity = await this.getQuantity(productName);
    const difference = quantity - currentQuantity;

    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        await this.getIncreaseQuantityButton(productName).click();
        await this.page.waitForTimeout(300);
      }
    } else if (difference < 0) {
      for (let i = 0; i < Math.abs(difference); i++) {
        await this.getDecreaseQuantityButton(productName).click();
        await this.page.waitForTimeout(300);
      }
    }
  }

  /**
   * Get current quantity for a product
   */
  async getQuantity(productName: string): Promise<number> {
    // Try select dropdown first (cart page)
    const select = this.getQuantitySelect(productName);
    if (await select.isVisible({ timeout: 1000 }).catch(() => false)) {
      const value = await select.inputValue();
      return parseInt(value, 10) || 1;
    }
    
    // Try number input
    const input = this.getQuantityInput(productName);
    if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
      const value = await input.inputValue();
      return parseInt(value, 10) || 1;
    }
    
    // Fallback: try to read from text content
    const item = this.getCartItem(productName);
    const quantityText = await item.locator('[data-quantity], .quantity').textContent().catch(() => "1");
    return parseInt(quantityText || "1", 10);
  }

  /**
   * Remove item from cart
   */
  async removeItem(productName: string): Promise<void> {
    await this.getRemoveItemButton(productName).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get item count display
   */
  getItemCount(): Locator {
    return this.page.locator('[data-testid="item-count"]').or(this.page.getByText(/items? \(\d+\)/i));
  }

  /**
   * Get subtotal/total display
   */
  getTotal(): Locator {
    return this.page.locator('[data-testid="cart-total"]').or(this.page.getByText(/\$\d+\.\d{2}/));
  }

  /**
   * Get order summary section
   */
  getOrderSummary(): Locator {
    return this.page.locator('[data-testid="order-summary"]').or(this.page.getByRole("region", { name: /order summary/i }));
  }

  /**
   * Click proceed to checkout
   * Includes retry logic and better navigation verification
   */
  async proceedToCheckout(): Promise<void> {
    // Wait for cart to be hydrated before proceeding
    await this.waitForHydration();
    
    // Verify cart has items before navigating
    // Note: Zustand persist middleware wraps data in a "state" object
    const cartHasItems = await this.page.evaluate(() => {
      try {
        const data = localStorage.getItem("cart-storage");
        if (!data) return false;
        const parsed = JSON.parse(data);
        // Zustand persist format: { state: { items: [...], ... }, version: 0 }
        const items = parsed.state?.items || parsed.items || [];
        return items.length > 0;
      } catch {
        return false;
      }
    });
    
    if (!cartHasItems) {
      throw new Error("Cannot proceed to checkout - cart is empty");
    }
    
    const button = this.getProceedToCheckoutButton();
    await button.waitFor({ state: "visible", timeout: 10000 });
    
    // Click and wait for navigation with retry
    const maxAttempts = 3;
    let navigated = false;
    
    for (let attempt = 0; attempt < maxAttempts && !navigated; attempt++) {
      await button.click();
      
      // Wait for URL to change
      try {
        await this.page.waitForURL((url) => url.toString().includes("/checkout"), { 
          timeout: 10000 
        });
        navigated = true;
      } catch {
        // URL didn't change, check if we're still on cart page
        const currentUrl = this.page.url();
        if (currentUrl.includes("/checkout")) {
          navigated = true;
        } else if (attempt < maxAttempts - 1) {
          // Wait a bit before retry
          await this.page.waitForTimeout(1000);
          // Re-verify button is still visible
          await button.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
        }
      }
    }
    
    if (!navigated) {
      const currentUrl = this.page.url();
      throw new Error(`Navigation to checkout failed after ${maxAttempts} attempts. Current URL: ${currentUrl}`);
    }
    
    // Wait for checkout page to load fully
    await this.page.waitForLoadState("domcontentloaded");
    
    // Wait for checkout page content (either heading or empty cart message)
    await Promise.race([
      this.page.getByRole("heading", { name: /checkout/i }).waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
      this.page.getByText(/your cart is empty|cart is empty/i).waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
    ]);
    
    // Wait for cart hydration on checkout page
    await waitForCartHydration(this.page, 5000);
  }

  /**
   * Verify cart item is present
   */
  async verifyItemPresent(productName: string): Promise<void> {
    await expect(this.getCartItem(productName)).toBeVisible();
  }

  /**
   * Verify cart is empty
   */
  async verifyCartEmpty(): Promise<void> {
    await expect(this.page.getByText(/your cart is empty/i).or(this.page.getByText(/cart is empty/i))).toBeVisible();
  }

  /**
   * Get number of items in cart
   */
  async getItemCountNumber(): Promise<number> {
    try {
      const countText = await this.getItemCount().textContent();
      const match = countText?.match(/(\d+)/);
      return match && match[1] ? parseInt(match[1], 10) : 0;
    } catch {
      // If count element not found, count visible items
      const items = this.page.locator('[data-testid="cart-item"]');
      return await items.count();
    }
  }

  /**
   * Clear all items from cart (if clear button exists)
   */
  async clearCart(): Promise<void> {
    const clearButton = this.page.getByRole("button", { name: /clear cart|remove all/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
    }
  }
}
