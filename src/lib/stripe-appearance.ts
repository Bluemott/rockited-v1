/**
 * Stripe Appearance API Configuration
 * Maps site theme colors to Stripe Elements Appearance API
 *
 * NOTE: This is for Payment Element, NOT Embedded Checkout.
 * Embedded Checkout appearance is limited to Dashboard settings.
 *
 * If you need programmatic appearance control, use Payment Element instead of Embedded Checkout.
 */

import { themeHSLLight, themeHSLDark } from "./theme";

export type ThemeMode = "light" | "dark";

/**
 * Get Stripe Appearance API configuration based on theme mode
 * Maps site theme colors to Stripe Appearance API variables
 */
export function getStripeAppearance(mode: ThemeMode = "light") {
  const themeColors = mode === "light" ? themeHSLLight : themeHSLDark;

  // Convert HSL strings to proper HSL format for Stripe
  // Stripe expects format like "hsl(252, 75%, 18%)"
  const formatHSL = (hslString: string) => {
    return `hsl(${hslString.replace(/\s+/g, ", ")})`;
  };

  return {
    theme: mode === "dark" ? ("night" as const) : ("stripe" as const),
    variables: {
      // Colors - Stripe expects HSL format with commas
      colorBackground: formatHSL(themeColors.background),
      colorText: formatHSL(themeColors.textPrimary),
      colorPrimary: formatHSL(themeColors.primary),
      colorDanger: formatHSL(themeColors.error),

      // Border and spacing
      borderRadius: "0.5rem", // Match site border radius (8px)
      spacingUnit: "4px",

      // Typography
      fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSizeBase: "16px",
    },
    rules: {
      // Soften internal dividers so lines don't appear to run through headings/labels
      ".BlockDivider": {
        backgroundColor: "transparent",
        border: "none",
      },
      ".InputDivider": {
        backgroundColor: "transparent",
        border: "none",
      },
    },
  };
}
