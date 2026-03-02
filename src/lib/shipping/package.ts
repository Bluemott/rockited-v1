/**
 * Centralized package derivation from WooCommerce products for shipping rate quotes.
 * Single combined package assumption: total weight across all items + first product's
 * dimensions (or defaults). For accurate estimates, set Weight and Dimensions
 * (L×W×H in inches) on each shippable product in WooCommerce.
 */

import type { WooProduct } from "@/lib/types";

/** Max length + girth in inches (carrier-agnostic sanity clamp). */
const MAX_LENGTH_PLUS_GIRTH = 108;

export interface DerivedPackage {
  weightLbs: number;
  length: number;
  width: number;
  height: number;
  totalWeight: number;
}

export interface ProductWithQuantity extends WooProduct {
  quantity: number;
}

/** Default dimensions (inches) when product has none (larger package). */
const DEFAULT_LENGTH = 9;
const DEFAULT_WIDTH = 6;
const DEFAULT_HEIGHT = 1;

/** Small-package defaults when no dimensions and total weight is low (e.g. buttons). */
const SMALL_DEFAULT_LENGTH = 6;
const SMALL_DEFAULT_WIDTH = 4;
const SMALL_DEFAULT_HEIGHT = 0.5;

/** Weight threshold (lb) below which we use small-package defaults when no dimensions. */
const SMALL_PACKAGE_WEIGHT_THRESHOLD_LBS = 1;

/** Minimum weight (lb) for rate quotes. */
const MIN_WEIGHT_LBS = 0.1;

function parseDimension(value: string | undefined): number {
  const n = parseFloat(String(value || "0").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Derive a single combined package from product list: total weight and first product's dimensions (or defaults).
 * Weight is normalized to at least MIN_WEIGHT_LBS. Dimensions are clamped to a max length+girth.
 */
export function derivePackageFromProducts(
  productDetails: ProductWithQuantity[]
): DerivedPackage {
  const totalWeight = productDetails.reduce((sum, item) => {
    const w = parseFloat(String(item.weight || "0").trim());
    return sum + (Number.isFinite(w) ? w : 0) * item.quantity;
  }, 0);

  const weightLbs = Math.max(MIN_WEIGHT_LBS, totalWeight);

  const firstWithDims = productDetails.find(
    (p) =>
      p.dimensions &&
      (parseDimension(p.dimensions.length) > 0 ||
        parseDimension(p.dimensions.width) > 0 ||
        parseDimension(p.dimensions.height) > 0)
  );

  const useSmallDefaults =
    !firstWithDims && totalWeight < SMALL_PACKAGE_WEIGHT_THRESHOLD_LBS;
  const defaultLength = useSmallDefaults ? SMALL_DEFAULT_LENGTH : DEFAULT_LENGTH;
  const defaultWidth = useSmallDefaults ? SMALL_DEFAULT_WIDTH : DEFAULT_WIDTH;
  const defaultHeight = useSmallDefaults ? SMALL_DEFAULT_HEIGHT : DEFAULT_HEIGHT;

  let length = firstWithDims?.dimensions
    ? Math.max(1, parseDimension(firstWithDims.dimensions.length) || defaultLength)
    : defaultLength;
  let width = firstWithDims?.dimensions
    ? Math.max(1, parseDimension(firstWithDims.dimensions.width) || defaultWidth)
    : defaultWidth;
  let height = firstWithDims?.dimensions
    ? Math.max(0.25, parseDimension(firstWithDims.dimensions.height) || defaultHeight)
    : defaultHeight;

  const girth = 2 * (width + height);
  if (length + girth > MAX_LENGTH_PLUS_GIRTH) {
    const scale = MAX_LENGTH_PLUS_GIRTH / (length + girth);
    length = Math.max(1, Math.min(108, length * scale));
    width = Math.max(1, Math.min(108, width * scale));
    height = Math.max(0.25, Math.min(108, height * scale));
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Shipping: package dimensions scaled down to fit max length+girth 108 in"
      );
    }
  }

  return {
    weightLbs,
    length,
    width,
    height,
    totalWeight,
  };
}
