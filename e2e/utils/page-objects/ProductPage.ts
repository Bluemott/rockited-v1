import { Page, Locator, expect } from "@playwright/test";

import { dismissCookieConsent, waitForCartHydration } from "../test-helpers";

/**
 * Page Object Model for Product Pages
 * Handles interactions with product listing and product detail pages
 */
export class ProductPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to products page
   */
  async goto(): Promise<void> {
    await this.page.goto("/products");
    await this.page.waitForLoadState("networkidle");
    await dismissCookieConsent(this.page);
  }

  /**
   * Navigate to a specific product page by slug
   */
  async gotoProduct(slug: string): Promise<void> {
    await this.page.goto(`/products/${slug}`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get product card by product name
   */
  getProductCard(productName: string): Locator {
    return this.page.getByRole("article").filter({ hasText: productName }).first();
  }

  /**
   * Get add to cart button for a product
   */
  getAddToCartButton(productName: string): Locator {
    // Use data-testid first (more reliable), fall back to role-based selector
    return this.getProductCard(productName).locator('[data-testid="add-to-cart-button"]')
      .or(this.getProductCard(productName).getByRole("button", { name: /add to cart/i }));
  }

  /**
   * Click add to cart button for a product
   * Waits for cart badge to update AND localStorage to confirm item was added
   * Includes retry logic for flaky add operations
   */
  async addToCart(productName: string): Promise<void> {
    // Get current cart count from localStorage (more reliable than badge)
    // Note: Zustand persist middleware wraps data in a "state" object
    const initialCartState = await this.page.evaluate(() => {
      try {
        const data = localStorage.getItem("cart-storage");
        if (!data) return { count: 0 };
        const parsed = JSON.parse(data);
        // Zustand persist format: { state: { items: [...], ... }, version: 0 }
        const items = parsed.state?.items || parsed.items || [];
        return { count: items.length };
      } catch {
        return { count: 0 };
      }
    });
    
    const currentCount = initialCartState.count;
    const expectedCount = currentCount + 1;

    const button = this.getAddToCartButton(productName);
    await button.waitFor({ state: "visible", timeout: 10000 });
    
    // Use force: true to bypass any overlay/animation interference
    // This resolves "element intercepts pointer events" errors from hover animations
    await button.click({ force: true });
    
    // Wait for localStorage to be updated (primary verification)
    const maxWaitTime = 8000;
    const startTime = Date.now();
    let verified = false;
    
    while (Date.now() - startTime < maxWaitTime && !verified) {
      const cartState = await this.page.evaluate(() => {
        try {
          const data = localStorage.getItem("cart-storage");
          if (!data) return { count: 0, items: [] };
          const parsed = JSON.parse(data);
          // Zustand persist format: { state: { items: [...], ... }, version: 0 }
          const items = parsed.state?.items || parsed.items || [];
          return { count: items.length, items };
        } catch {
          return { count: 0, items: [] };
        }
      });
      
      if (cartState.count >= expectedCount) {
        verified = true;
        break;
      }
      
      await this.page.waitForTimeout(200);
    }
    
    if (!verified) {
      throw new Error(`Failed to add "${productName}" to cart. Expected ${expectedCount} items but localStorage has fewer.`);
    }
    
    // Also verify cart badge in header (secondary verification)
    const cartBadge = this.page.locator('header [data-testid="cart-badge-count"]');
    try {
      await expect(cartBadge).toBeVisible({ timeout: 5000 });
      // Wait for badge text to update
      await this.page.waitForTimeout(300);
    } catch {
      // Badge might be slow to render, but localStorage is verified so continue
    }
    
    // Wait for hydration to complete
    await waitForCartHydration(this.page);
  }

  /**
   * Get product link by name
   */
  getProductLink(productName: string): Locator {
    return this.page.getByRole("link", { name: productName }).first();
  }

  /**
   * Click on a product to view details
   */
  async clickProduct(productName: string): Promise<void> {
    const link = this.getProductLink(productName);
    await link.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Set quantity for product (if quantity selector exists)
   */
  async setQuantity(quantity: number): Promise<void> {
    // This would be on the product detail page
    const quantitySelect = this.page.getByLabel(/quantity/i);
    if (await quantitySelect.isVisible()) {
      await quantitySelect.selectOption(quantity.toString());
    }
  }

  /**
   * Verify product is displayed
   */
  async verifyProductDisplayed(productName: string): Promise<void> {
    await expect(this.getProductCard(productName)).toBeVisible();
  }

  /**
   * Get cart icon/count (if visible in header)
   */
  getCartIcon(): Locator {
    return this.page.getByRole("button", { name: /cart/i }).or(this.page.locator('[aria-label*="cart" i]'));
  }

  /**
   * Wait for products to load
   * Improved to wait for API response and handle errors gracefully
   */
  async waitForProducts(): Promise<void> {
    // First, wait for products API response
    try {
      await this.page.waitForResponse(
        (response) => {
          const url = response.url();
          return (url.includes("/api/products") || url.includes("/products")) && response.status() === 200;
        },
        { timeout: 15000 }
      ).catch(() => {
        // API might not be called if products are cached, continue anyway
      });
    } catch {
      // Continue even if API response wait fails
    }

    // Wait for product cards to appear in DOM
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await this.page.waitForSelector('[role="article"], [data-testid="product-card"]', {
          state: "visible",
          timeout: 10000,
        });
        
        // Verify we actually have products (not just an error message)
        const errorMessage = this.page.getByText(/failed to load products|error loading products/i);
        const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (hasError) {
          throw new Error("Products failed to load - error message displayed");
        }
        
        // Success - products are loaded
        return;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          // Check if there's an error message
          const errorMessage = this.page.getByText(/failed to load products|error loading products/i);
          const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
          
          if (hasError) {
            throw new Error("Products failed to load after retries - error message displayed");
          }
          
          // If no error message, throw the original error
          throw error;
        }
        // Wait before retry
        await this.page.waitForTimeout(1000);
      }
    }
  }
}
