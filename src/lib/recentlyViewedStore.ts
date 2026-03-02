import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENTLY_VIEWED = 12;

export interface RecentlyViewedItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageSrc: string;
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[];
  addViewed: (product: RecentlyViewedItem) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],

      addViewed: (product) => {
        const { items } = get();
        const filtered = items.filter((i) => i.id !== product.id);
        const next = [product, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
        set({ items: next });
      },
    }),
    {
      name: "recently-viewed",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
