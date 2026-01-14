import { wooApi } from "./client";
import { getProduct } from "./products";
import type { WooShippingZone, WooShippingMethod, WooShippingRate } from "../types";

// Shipping Zones API functions
export const getShippingZones = async (): Promise<WooShippingZone[]> => {
  try {
    const response = await wooApi.get("shipping/zones");
    return response.data;
  } catch (error) {
    console.error("Error fetching shipping zones:", error);
    throw error;
  }
};

export const getShippingZoneMethods = async (zoneId: number): Promise<WooShippingMethod[]> => {
  try {
    const response = await wooApi.get(`shipping/zones/${zoneId}/methods`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching shipping methods for zone ${zoneId}:`, error);
    throw error;
  }
};

// Shipping calculation function
export const calculateShipping = async (params: {
  country: string;
  state?: string;
  postcode?: string;
  city?: string;
  products: Array<{ id: number; quantity: number }>;
}) => {
  try {
    // First, get product details to calculate total weight and dimensions
    const productDetails = await Promise.all(
      params.products.map(async (item) => {
        const product = await getProduct(item.id);
        return {
          ...product,
          quantity: item.quantity,
        };
      })
    );

    // Calculate total weight
    const totalWeight = productDetails.reduce((sum, item) => {
      const weight = parseFloat(item.weight || "0");
      return sum + weight * item.quantity;
    }, 0);

    // Get shipping zones
    const zones = await getShippingZones();

    // Find matching zone based on location
    const matchingZone =
      zones.find((zone) => {
        if (zone.locations) {
          return zone.locations.some((location) => {
            if (location.type === "country" && location.code === params.country) {
              return true;
            }
            if (
              location.type === "state" &&
              location.code === `${params.country}:${params.state}`
            ) {
              return true;
            }
            return false;
          });
        }
        return false;
      }) || zones.find((zone) => zone.id === 0); // Fallback to default zone

    if (!matchingZone) {
      throw new Error("No matching shipping zone found");
    }

    // Get shipping methods for the zone
    const methods = await getShippingZoneMethods(matchingZone.id);

    // Calculate shipping rates based on methods
    const rates: WooShippingRate[] = methods.map((method) => {
      let cost = "0.00";

      // Calculate cost based on method type
      if (method.settings && method.settings.cost) {
        const baseCost = parseFloat(method.settings.cost.value || "0");

        // For weight-based shipping, add weight cost
        if (method.settings.class_cost && totalWeight > 0) {
          // This is a simplified calculation - actual implementation may vary
          const weightCost = totalWeight * parseFloat(method.settings.class_cost.value || "0");
          cost = (baseCost + weightCost).toFixed(2);
        } else {
          cost = baseCost.toFixed(2);
        }
      }

      return {
        method_id: method.method_id,
        method_title: method.method_title || method.title || "Standard Shipping",
        cost: cost,
        estimated_delivery: method.settings?.estimated_delivery?.value || "3-5 business days",
      };
    });

    return {
      zone_id: matchingZone.id,
      zone_name: matchingZone.name,
      rates,
      total_weight: totalWeight.toFixed(2),
    };
  } catch (error) {
    console.error("Error calculating shipping:", error);
    throw error;
  }
};

// Get shipping methods (all available methods)
export const getShippingMethods = async (): Promise<
  Array<WooShippingMethod & { zone_id: number; zone_name: string }>
> => {
  try {
    const zones = await getShippingZones();
    const allMethods: Array<WooShippingMethod & { zone_id: number; zone_name: string }> = [];

    for (const zone of zones) {
      try {
        const methods = await getShippingZoneMethods(zone.id);
        allMethods.push(
          ...methods.map((method) => ({
            ...method,
            zone_id: zone.id,
            zone_name: zone.name,
          }))
        );
      } catch (error) {
        console.error(`Error fetching methods for zone ${zone.id}:`, error);
      }
    }

    return allMethods;
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    throw error;
  }
};
