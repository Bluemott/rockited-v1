import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Cart, CartItem } from "./types";

interface CartStore extends Cart {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.id === item.id);

        if (existingItem) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }));
        } else {
          set((state) => ({
            items: [...state.items, { ...item, quantity: 1 }],
          }));
        }

        // Recalculate totals
        const updatedItems = get().items;
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        set({ total, itemCount });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        // Recalculate totals
        const updatedItems = get().items;
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        set({ total, itemCount });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        }));

        // Recalculate totals
        const updatedItems = get().items;
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        set({ total, itemCount });
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
