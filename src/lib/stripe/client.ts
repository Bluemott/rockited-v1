import Stripe from "stripe";
import { env } from "../env";

// Initialize Stripe with validated environment variable
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
  maxNetworkRetries: 2,
  timeout: 20000,
});
