import { describe, it, expect, beforeEach } from "vitest";

import { useCartStore } from "../store";
import type { CartItem } from "../types";

// Helper function to create a mock cart item
const createMockItem = (overrides?: Partial<CartItem>): Omit<CartItem, "quantity"> => ({
  id: 1,
  name: "Test Product",
  price: 10.99,
  image: "/test-image.jpg",
  sku: "TEST-001",
  ...overrides,
});

describe("Cart Store", () => {
  beforeEach(() => {
    // Clear cart before each test
    useCartStore.getState().clearCart();
    // Clear localStorage
    localStorage.clear();
  });

  describe("addItem", () => {
    it("should add new item to empty cart", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        id: 1,
        name: "Test Product",
        price: 10.99,
        quantity: 1,
      });
      expect(state.total).toBeCloseTo(10.99, 2);
      expect(state.itemCount).toBe(1);
    });

    it("should increment quantity when adding duplicate item", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      store.addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]!.quantity).toBe(2);
      expect(state.total).toBeCloseTo(21.98, 2);
      expect(state.itemCount).toBe(2);
    });

    it("should add multiple different items", () => {
      const store = useCartStore.getState();
      const item1 = createMockItem({ id: 1, price: 10.99 });
      const item2 = createMockItem({ id: 2, name: "Product 2", price: 20.50 });

      store.addItem(item1);
      store.addItem(item2);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0]).toBeDefined();
      expect(state.items[1]).toBeDefined();
      expect(state.total).toBeCloseTo(31.49, 2);
      expect(state.itemCount).toBe(2);
    });

    it("should calculate total correctly with multiple quantities", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 15.99 });

      // Add item 3 times
      store.addItem(item);
      store.addItem(item);
      store.addItem(item);

      const state = useCartStore.getState();
      expect(state.items[0]!.quantity).toBe(3);
      expect(state.total).toBeCloseTo(47.97, 2);
      expect(state.itemCount).toBe(3);
    });

    it("should handle items with zero price", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 0 });

      store.addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(1);
    });

    it("should handle items with decimal prices", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 9.99 });

      store.addItem(item);
      store.addItem(item);

      const state = useCartStore.getState();
      expect(state.total).toBeCloseTo(19.98, 2);
    });
  });

  describe("removeItem", () => {
    it("should remove item from cart", () => {
      const store = useCartStore.getState();
      const item1 = createMockItem({ id: 1, price: 10.99 });
      const item2 = createMockItem({ id: 2, price: 20.50 });

      store.addItem(item1);
      store.addItem(item2);
      store.removeItem(1);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]!.id).toBe(2);
      expect(state.total).toBeCloseTo(20.50, 2);
      expect(state.itemCount).toBe(1);
    });

    it("should recalculate totals after removing item", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      store.addItem(item); // Quantity 2
      store.removeItem(1);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
    });

    it("should not error when removing non-existent item", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      store.removeItem(999); // Non-existent ID

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.total).toBeCloseTo(10.99, 2);
    });

    it("should handle removing from empty cart", () => {
      const store = useCartStore.getState();

      store.removeItem(1);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity to valid number", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      store.updateQuantity(1, 5);

      const state = useCartStore.getState();
      expect(state.items[0]!.quantity).toBe(5);
      expect(state.total).toBeCloseTo(54.95, 2);
      expect(state.itemCount).toBe(5);
    });

    it("should remove item when quantity is set to 0", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      store.updateQuantity(1, 0);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
    });

    it("should remove item when quantity is negative", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      store.updateQuantity(1, -5);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
    });

    it("should recalculate totals after quantity update", () => {
      const store = useCartStore.getState();
      const item1 = createMockItem({ id: 1, price: 10.99 });
      const item2 = createMockItem({ id: 2, price: 20.50 });

      store.addItem(item1);
      store.addItem(item2);
      store.updateQuantity(1, 3);

      const state = useCartStore.getState();
      expect(state.items[0]!.quantity).toBe(3);
      expect(state.items[1]!.quantity).toBe(1);
      expect(state.total).toBeCloseTo(53.47, 2); // (10.99 * 3) + (20.50 * 1)
      expect(state.itemCount).toBe(4);
    });

    it("should handle updating quantity for non-existent item", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      store.updateQuantity(999, 5);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]!.quantity).toBe(1);
      expect(state.total).toBeCloseTo(10.99, 2);
    });

    it("should handle large quantities", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 1.50 });

      store.addItem(item);
      store.updateQuantity(1, 100);

      const state = useCartStore.getState();
      expect(state.items[0]!.quantity).toBe(100);
      expect(state.total).toBeCloseTo(150.0, 2);
      expect(state.itemCount).toBe(100);
    });
  });

  describe("clearCart", () => {
    it("should clear cart with items", () => {
      const store = useCartStore.getState();
      const item1 = createMockItem({ id: 1, price: 10.99 });
      const item2 = createMockItem({ id: 2, price: 20.50 });

      store.addItem(item1);
      store.addItem(item2);
      store.clearCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
    });

    it("should clear empty cart without error", () => {
      const store = useCartStore.getState();

      store.clearCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
    });
  });

  describe("Total calculation", () => {
    it("should calculate single item total correctly", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 25.99 });

      store.addItem(item);

      const state = useCartStore.getState();
      expect(state.total).toBeCloseTo(25.99, 2);
    });

    it("should calculate multiple items with different quantities", () => {
      const store = useCartStore.getState();
      const item1 = createMockItem({ id: 1, price: 10.00 });
      const item2 = createMockItem({ id: 2, price: 15.50 });
      const item3 = createMockItem({ id: 3, price: 5.25 });

      store.addItem(item1);
      store.addItem(item1); // Quantity 2
      store.addItem(item2);
      store.addItem(item3);
      store.addItem(item3); // Quantity 2
      store.addItem(item3); // Quantity 3

      const state = useCartStore.getState();
      // (10.00 * 2) + (15.50 * 1) + (5.25 * 3) = 20 + 15.50 + 15.75 = 51.25
      expect(state.total).toBeCloseTo(51.25, 2);
      expect(state.itemCount).toBe(6);
    });

    it("should handle precision with decimal prices", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 0.1 });

      store.addItem(item);
      store.addItem(item);
      store.addItem(item);

      const state = useCartStore.getState();
      expect(state.total).toBeCloseTo(0.3, 2);
    });
  });

  describe("Item count calculation", () => {
    it("should count items correctly", () => {
      const store = useCartStore.getState();
      const item1 = createMockItem({ id: 1, price: 10.99 });
      const item2 = createMockItem({ id: 2, price: 20.50 });

      store.addItem(item1);
      store.addItem(item1); // Quantity 2
      store.addItem(item2);

      const state = useCartStore.getState();
      expect(state.itemCount).toBe(3);
    });

    it("should update item count when quantity changes", () => {
      const store = useCartStore.getState();
      const item = createMockItem({ id: 1, price: 10.99 });

      store.addItem(item);
      expect(useCartStore.getState().itemCount).toBe(1);

      store.updateQuantity(1, 5);
      expect(useCartStore.getState().itemCount).toBe(5);

      store.updateQuantity(1, 2);
      expect(useCartStore.getState().itemCount).toBe(2);
    });
  });
});
