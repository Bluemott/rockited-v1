import { test as base } from "@playwright/test";

import { setupTest, addFirstProductAndGoToCheckout } from "../utils/test-helpers";

/**
 * Optional fixture: provides a cart with one product and navigates to checkout.
 * Use in checkout specs when you need page already on checkout with one item.
 *
 * Usage:
 *   import { test, expect } from "../fixtures/checkout";
 *   test("my test", async ({ page, cartWithOneProduct }) => {
 *     const { productName } = cartWithOneProduct;
 *     // page is already on /checkout with one product in cart
 *   });
 */
export const test = base.extend<{
  cartWithOneProduct: { productName: string };
}>({
  cartWithOneProduct: async ({ page }, runWithFixture) => {
    await setupTest(page);
    const result = await addFirstProductAndGoToCheckout(page);
    await runWithFixture(result);
  },
});

export { expect } from "@playwright/test";
