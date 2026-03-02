/**
 * Shippo API types (Address Validation v2, Shipments, Rates)
 * See: https://docs.goshippo.com/
 */

/** Address validation (GET /v2/addresses/validate) */
export interface ShippoValidateResponse {
  original_address?: {
    address_line_1?: string;
    address_line_2?: string;
    city_locality?: string;
    state_province?: string;
    postal_code?: string;
    country_code?: string;
  };
  recommended_address?: {
    address_line_1?: string;
    address_line_2?: string;
    city_locality?: string;
    state_province?: string;
    postal_code?: string;
    country_code?: string;
  };
  analysis?: {
    validation_result?: {
      value?: "valid" | "partially_valid" | "invalid";
      reasons?: Array<{ code?: string; description?: string }>;
    };
    address_type?: "residential" | "commercial" | "unknown" | "po_box" | "military";
  };
  geo?: { latitude?: number; longitude?: number };
}

/** Inline address for shipment creation */
export interface ShippoAddressParams {
  name?: string;
  address_line_1: string;
  address_line_2?: string;
  city_locality: string;
  state_province: string;
  postal_code: string;
  country_code: string;
}

/** Parcel for shipment creation (dimensional). */
export interface ShippoParcelParams {
  length: string;
  width: string;
  height: string;
  distance_unit: "in" | "cm" | "ft" | "mm" | "m" | "yd";
  weight: string;
  mass_unit: "lb" | "oz" | "g" | "kg";
}

/** Parcel from carrier template (e.g. USPS flat-rate envelope); dimensions come from template. */
export interface ShippoParcelTemplateParams {
  template: string;
  weight: string;
  mass_unit: "lb" | "oz" | "g" | "kg";
}

/** Single rate in shipment response */
export interface ShippoRate {
  object_id?: string;
  amount?: string;
  currency?: string;
  provider?: string;
  carrier?: string;
  servicelevel?: {
    name?: string;
    token?: string;
  };
  estimated_days?: number | null;
  duration_terms?: string;
}

/** Shipment creation response */
export interface ShippoShipmentResponse {
  object_id?: string;
  status?: string;
  rates?: ShippoRate[];
  address_from?: unknown;
  address_to?: unknown;
  parcels?: unknown[];
}
