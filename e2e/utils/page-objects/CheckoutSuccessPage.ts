import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object Model for Checkout Success Page
 * Handles interactions with the order confirmation page
 */
export class CheckoutSuccessPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to checkout success page with session ID
   */
  async goto(sessionId: string): Promise<void> {
    await this.page.goto(`/checkout?session_id=${sessionId}`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get success heading/title
   */
  getSuccessHeading(): Locator {
    return this.page.getByRole("heading", { name: /order successful|thank you|order confirmed/i });
  }

  /**
   * Get success message
   */
  getSuccessMessage(): Locator {
    return this.page.getByText(/thank you for your purchase|order has been confirmed/i);
  }

  /**
   * Get session ID display (if shown)
   */
  getSessionId(): Locator {
    return this.page.getByText(/session id/i).or(this.page.locator('[data-testid="session-id"]'));
  }

  /**
   * Get order number (if displayed)
   */
  getOrderNumber(): Locator {
    return this.page.getByText(/order number|order #/i).or(this.page.locator('[data-testid="order-number"]'));
  }

  /**
   * Get continue shopping button
   */
  getContinueShoppingButton(): Locator {
    return this.page.getByRole("link", { name: /continue shopping/i }).or(this.page.getByRole("button", { name: /continue shopping/i }));
  }

  /**
   * Get back to home button
   */
  getBackToHomeButton(): Locator {
    return this.page.getByRole("link", { name: /back to home|home/i }).or(this.page.getByRole("button", { name: /home/i }));
  }

  /**
   * Get "What's Next?" section
   */
  getNextStepsSection(): Locator {
    return this.page.getByText(/what's next|next steps/i).locator("..");
  }

  /**
   * Verify success page is displayed
   */
  async verifySuccess(): Promise<void> {
    await expect(this.getSuccessHeading()).toBeVisible({ timeout: 10000 });
    await expect(this.getSuccessMessage()).toBeVisible();
  }

  /**
   * Verify session ID is displayed (if applicable)
   */
  async verifySessionId(sessionId?: string): Promise<void> {
    if (sessionId) {
      await expect(this.page.getByText(sessionId)).toBeVisible();
    } else {
      await expect(this.getSessionId()).toBeVisible();
    }
  }

  /**
   * Click continue shopping
   */
  async continueShopping(): Promise<void> {
    await this.getContinueShoppingButton().click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click back to home
   */
  async backToHome(): Promise<void> {
    await this.getBackToHomeButton().click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get invalid session message (if session ID is invalid)
   */
  getInvalidSessionMessage(): Locator {
    return this.page.getByText(/invalid session|no valid checkout session/i);
  }

  /**
   * Verify invalid session message
   */
  async verifyInvalidSession(): Promise<void> {
    await expect(this.getInvalidSessionMessage()).toBeVisible();
  }
}
