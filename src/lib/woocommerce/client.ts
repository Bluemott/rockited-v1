import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

import { env } from "../env";

// Initialize WooCommerce API client
export const wooApi = new WooCommerceRestApi({
  url: env.WOOCOMMERCE_URL,
  consumerKey: env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: env.WOOCOMMERCE_CONSUMER_SECRET,
  version: "wc/v3",
  queryStringAuth: true, // Force Basic Authentication as query string true and using under HTTPS
});
