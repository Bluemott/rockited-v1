import { getProduct } from "./products";

/**
 * Real-time inventory check for a product
 * @param productId - The product ID to check
 * @returns Inventory information including stock status, quantity, pricing
 */
export const checkInventory = async (productId: number) => {
  try {
    const product = await getProduct(productId);
    return {
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
      on_sale: product.on_sale,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
    };
  } catch (error) {
    console.error(`Error checking inventory for product ${productId}:`, error);
    throw error;
  }
};
