/**
 * Shippo API client (Address Validation v2, Shipments/Rates)
 * Server-only. See https://docs.goshippo.com/
 */

import type { WooShippingRate } from "@/lib/types";

import type {
  ShippoRate,
  ShippoShipmentResponse,
  ShippoValidateResponse,
} from "./types";

const SHIPPO_API_BASE = "https://api.goshippo.com";

function getShippoConfig() {
  const apiKey = process.env.SHIPPO_API_KEY ?? process.env.SHIPPO_SECRET_TOKEN;
  const name = process.env.SHIPPO_ORIGIN_NAME ?? "";
  const street1 = process.env.SHIPPO_ORIGIN_STREET1 ?? "";
  const city = process.env.SHIPPO_ORIGIN_CITY ?? "";
  const state = process.env.SHIPPO_ORIGIN_STATE ?? "";
  const zip = process.env.SHIPPO_ORIGIN_ZIP ?? "";
  const country = process.env.SHIPPO_ORIGIN_COUNTRY ?? "US";
  const carrierIdsRaw = process.env.SHIPPO_CARRIER_ACCOUNT_IDS ?? "";
  const carrierAccountIds = carrierIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return { apiKey, name, street1, city, state, zip, country, carrierAccountIds };
}

export function isShippoConfigured(): boolean {
  const { apiKey, street1, city, state, zip } = getShippoConfig();
  const zip5 = zip.trim().replace(/\D/g, "").slice(0, 5);
  return Boolean(apiKey?.trim() && street1?.trim() && city?.trim() && state?.trim() && /^\d{5}$/.test(zip5));
}

/** Standardized address shape (same as previous USPS integration). */
export interface ShippoStandardizedAddress {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  zipPlus4?: string;
}

export type StandardizeAddressResult =
  | { ok: true; standardized: ShippoStandardizedAddress }
  | { ok: false; serviceUnavailable?: true }
  | { ok: false };

/**
 * Validate/standardize a US address (Shippo v2 Address Validation).
 * Returns same shape as previous standardizeAddress for drop-in replacement.
 */
export async function standardizeAddress(params: {
  streetAddress: string;
  secondaryAddress?: string;
  city: string;
  state: string;
  ZIPCode: string;
}): Promise<StandardizeAddressResult | null> {
  const { apiKey } = getShippoConfig();
  if (!apiKey?.trim()) return null;

  const street = params.streetAddress?.trim();
  const cityVal = params.city?.trim();
  const stateVal = params.state?.trim().slice(0, 2).toUpperCase();
  const zip = params.ZIPCode?.trim().replace(/\D/g, "").slice(0, 5);
  if (!street || !cityVal || !stateVal || !/^\d{5}$/.test(zip)) return null;

  const search = new URLSearchParams({
    address_line_1: street,
    city_locality: cityVal,
    state_province: stateVal,
    postal_code: zip,
    country_code: "US",
  });
  if (params.secondaryAddress?.trim()) {
    search.set("address_line_2", params.secondaryAddress.trim());
  }

  const url = `${SHIPPO_API_BASE}/v2/addresses/validate?${search.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `ShippoToken ${apiKey.trim()}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status >= 500 && res.status < 600) {
      return { ok: false, serviceUnavailable: true };
    }
    if (!res.ok) {
      return { ok: false };
    }

    const data = (await res.json()) as ShippoValidateResponse;

    if (data.analysis?.address_type === "po_box") {
      return { ok: false };
    }

    const validationValue = data.analysis?.validation_result?.value;
    if (validationValue !== "valid" && validationValue !== "partially_valid") {
      return { ok: false };
    }

    const addr = data.recommended_address ?? data.original_address;
    if (!addr) return { ok: false };

    const line1 =
      addr.address_line_1?.trim() ||
      [addr.address_line_2, addr.city_locality, addr.state_province].filter(Boolean).join(", ") ||
      street;
    const city = addr.city_locality?.trim() ?? cityVal;
    const state = addr.state_province?.trim() ?? stateVal;
    const rawPostal = addr.postal_code?.trim().replace(/\D/g, "") ?? zip.replace(/\D/g, "");
    const postal_code = rawPostal.slice(0, 5);
    const plus4 = rawPostal.slice(5, 9);
    const zipPlus4 = plus4.length === 4 ? plus4 : undefined;

    if (!line1 || !city || !state || !postal_code) return { ok: false };

    return {
      ok: true,
      standardized: {
        line1,
        city,
        state,
        postal_code,
        zipPlus4,
      },
    };
  } catch {
    return { ok: false, serviceUnavailable: true };
  }
}

export interface GetShippoRatesParams {
  country: string;
  state?: string;
  postcode: string;
  city?: string;
  weightLbs: number;
  length: number;
  width: number;
  height: number;
}

/** Max sum of dimensions (in) for envelope-eligible rate shopping. */
const ENVELOPE_ELIGIBLE_DIMENSION_SUM_IN = 20;

/** Max weight (lb) for requesting USPS flat-rate envelope template rates. */
const ENVELOPE_ELIGIBLE_WEIGHT_LBS = 1;

/** USPS Small Flat Rate Envelope template token (Shippo carrier parcel template). */
const USPS_SMALL_FLAT_RATE_ENVELOPE_TEMPLATE = "USPS_SmallFlatRateEnvelope";

/** Max number of rates to return (cheapest first). */
const MAX_RATES_RETURNED = 6;

function mapShippoRatesToWoo(rates: ShippoRate[]): WooShippingRate[] {
  return rates
    .filter((r) => r.amount != null && Number(r.amount) >= 0)
    .map((r) => {
      const amount = Number(r.amount).toFixed(2);
      const carrier = r.carrier ?? r.provider ?? "Carrier";
      const serviceName = r.servicelevel?.name ?? "Standard";
      const title = `${carrier} ${serviceName}`.trim();
      const estimated_delivery =
        r.estimated_days != null
          ? `${r.estimated_days} business day${r.estimated_days !== 1 ? "s" : ""}`
          : r.duration_terms ?? undefined;
      return {
        method_id: (r.object_id ?? `${carrier}_${serviceName}`).replace(/\s+/g, "_").toLowerCase(),
        method_title: title,
        cost: amount,
        estimated_delivery,
      };
    });
}

/** Merge two rate lists: keep lowest cost per logical service (carrier + title), then sort by cost ascending. */
function mergeAndSortRates(a: WooShippingRate[], b: WooShippingRate[]): WooShippingRate[] {
  const byKey = new Map<string, WooShippingRate>();
  for (const r of [...a, ...b]) {
    const key = `${(r.method_title ?? "").toLowerCase().replace(/\s+/g, "_")}`;
    const existing = byKey.get(key);
    const cost = parseFloat(r.cost ?? "0");
    if (!existing || cost < parseFloat(existing.cost ?? "999")) {
      byKey.set(key, r);
    }
  }
  return Array.from(byKey.values()).sort(
    (x, y) => parseFloat(x.cost ?? "0") - parseFloat(y.cost ?? "0")
  );
}

async function createShipmentAndGetRates(
  config: ReturnType<typeof getShippoConfig>,
  addressFrom: object,
  addressTo: object,
  parcels: object[]
): Promise<WooShippingRate[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${SHIPPO_API_BASE}/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `ShippoToken ${config.apiKey!.trim()}`,
      },
      body: JSON.stringify({
        address_from: addressFrom,
        address_to: addressTo,
        parcels,
        async: false,
        ...(config.carrierAccountIds.length > 0 && { carrier_accounts: config.carrierAccountIds }),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = (await res.json()) as ShippoShipmentResponse;
    return mapShippoRatesToWoo(data.rates ?? []);
  } catch {
    return [];
  }
}

/**
 * Get shipping rates from Shippo (create shipment, map rates to WooShippingRate).
 * For small/light packages, also requests USPS Small Flat Rate Envelope rates and merges; returns sorted by price (cheapest first), capped at MAX_RATES_RETURNED.
 */
export async function getShippoRates(params: GetShippoRatesParams): Promise<WooShippingRate[]> {
  const config = getShippoConfig();
  if (!config.apiKey?.trim() || !isShippoConfigured()) return [];

  const zip5 = params.postcode.trim().replace(/\D/g, "").slice(0, 5);
  if (params.country.toUpperCase() !== "US" || !/^\d{5}$/.test(zip5)) return [];

  const originZip = config.zip.trim().replace(/\D/g, "").slice(0, 5);
  const addressFromPayload = {
    name: config.name || "Origin",
    street1: config.street1,
    city: config.city,
    state: config.state,
    zip: originZip,
    country: config.country.slice(0, 2).toUpperCase(),
  };

  const addressToPayload = {
    name: "Delivery",
    street1: params.city?.trim() ? `${params.city}, ${params.state ?? ""}`.trim() || "Rate request" : "Rate request",
    city: (params.city ?? "").trim() || "Anytown",
    state: (params.state ?? "").trim().slice(0, 2).toUpperCase() || "CA",
    zip: zip5,
    country: "US",
  };

  const dimensionalParcel = {
    length: String(Math.max(0.1, params.length)),
    width: String(Math.max(0.1, params.width)),
    height: String(Math.max(0.1, params.height)),
    distance_unit: "in" as const,
    weight: String(Math.max(0.1, params.weightLbs)),
    mass_unit: "lb" as const,
  };

  try {
    const dimensionalRates = await createShipmentAndGetRates(config, addressFromPayload, addressToPayload, [
      dimensionalParcel,
    ]);

    const dimensionSum = params.length + params.width + params.height;
    const envelopeEligible =
      params.weightLbs <= ENVELOPE_ELIGIBLE_WEIGHT_LBS &&
      dimensionSum <= ENVELOPE_ELIGIBLE_DIMENSION_SUM_IN;

    const merged = envelopeEligible
      ? (() => {
          const templateParcel = {
            template: USPS_SMALL_FLAT_RATE_ENVELOPE_TEMPLATE,
            weight: String(Math.max(0.1, params.weightLbs)),
            mass_unit: "lb" as const,
          };
          return createShipmentAndGetRates(config, addressFromPayload, addressToPayload, [
            templateParcel,
          ]).then((templateRates) => mergeAndSortRates(dimensionalRates, templateRates));
        })()
      : Promise.resolve([...dimensionalRates].sort(
          (a, b) => parseFloat(a.cost ?? "0") - parseFloat(b.cost ?? "0")
        ));

    const mergedRates = await merged;
    const capped = mergedRates.slice(0, MAX_RATES_RETURNED);

    if (capped.length > 0) return capped;
  } catch (err) {
    console.warn("Shippo rates error:", err);
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("Shippo returned no rates (check carrier accounts in Shippo dashboard). Using fallback.");
  }
  return [
    {
      method_id: "shippo_fallback",
      method_title: "Standard Shipping",
      cost: "9.99",
      estimated_delivery: "5-7 business days",
    },
  ];
}
