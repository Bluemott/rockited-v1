import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required and optional environment variables at runtime
 */
const envSchema = z.object({
  // WooCommerce Configuration (Required)
  WOOCOMMERCE_URL: z
    .string()
    .min(1, 'WOOCOMMERCE_URL is required')
    .refine(
      (url) => {
        // In production, must be HTTPS
        if (process.env.NODE_ENV === 'production') {
          return url.startsWith('https://');
        }
        // In development, allow HTTP for localhost
        return url.startsWith('http://') || url.startsWith('https://');
      },
      {
        message: 'WOOCOMMERCE_URL must use HTTPS in production',
      }
    ),
  WOOCOMMERCE_CONSUMER_KEY: z
    .string()
    .min(1, 'WOOCOMMERCE_CONSUMER_KEY is required')
    .startsWith('ck_', 'WOOCOMMERCE_CONSUMER_KEY must start with ck_'),
  WOOCOMMERCE_CONSUMER_SECRET: z
    .string()
    .min(1, 'WOOCOMMERCE_CONSUMER_SECRET is required')
    .startsWith('cs_', 'WOOCOMMERCE_CONSUMER_SECRET must start with cs_'),

  // Stripe Configuration (Required)
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required')
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required')
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required')
    .startsWith('pk_', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'),

  // Site Configuration (Required)
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_SITE_URL is required')
    .refine(
      (url) => {
        // In production, must be HTTPS
        if (process.env.NODE_ENV === 'production') {
          return url.startsWith('https://');
        }
        // In development, allow HTTP for localhost
        return url.startsWith('http://') || url.startsWith('https://');
      },
      {
        message: 'NEXT_PUBLIC_SITE_URL must use HTTPS in production',
      }
    ),

  // Optional Configuration
  STRIPE_LOGO_URL: z.string().optional(),
  STRIPE_TAX_ENABLED: z
    .string()
    .optional()
    .transform((val) => val !== 'false'),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

/**
 * Validated environment variables
 * Throws error at startup if validation fails
 */
export const env = (() => {
  try {
    return envSchema.parse({
      WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL,
      WOOCOMMERCE_CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY,
      WOOCOMMERCE_CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      STRIPE_LOGO_URL: process.env.STRIPE_LOGO_URL,
      STRIPE_TAX_ENABLED: process.env.STRIPE_TAX_ENABLED,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(
        `❌ Environment variable validation failed:\n${missingVars}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
})();

/**
 * Type-safe access to validated environment variables
 */
export type Env = z.infer<typeof envSchema>;
