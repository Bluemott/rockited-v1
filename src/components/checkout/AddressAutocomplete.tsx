"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceLike {
  address_components?: AddressComponent[];
  formatted_address?: string;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (library: string) => Promise<unknown>;
      };
    };
  }
}

export interface AddressSuggestion {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

interface AddressAutocompleteProps {
  /** Current value for the address line 1 field (controlled by parent). */
  value: string;
  /** Called when the user types in the field. */
  onChange: (value: string) => void;
  /** Called when user selects an address from Google suggestions; parent should update line1, city, state, postal_code. */
  onSelect: (address: AddressSuggestion) => void;
  disabled?: boolean;
  /** Restrict to US. */
  country?: string;
  id?: string;
  placeholder?: string;
  /** Optional ref to the input (e.g. for focusing "Change address"). */
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** Accessibility: id of hint text. */
  ariaDescribedBy?: string;
  /** Mark address line 1 as required. */
  required?: boolean;
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script";
/** Max place selections processed per minute (client-side throttle to reduce Google usage). */
const PLACE_SELECTIONS_CAP_PER_MINUTE = 10;
const PLACE_SELECTIONS_WINDOW_MS = 60_000;

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  disabled = false,
  country = "us",
  id = "ship-line1",
  placeholder = "Start typing your street address...",
  inputRef: externalRef,
  ariaDescribedBy,
  required = false,
}: AddressAutocompleteProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<HTMLElement | null>(null);
  const onSelectRef = useRef(onSelect);
  const onChangeRef = useRef(onChange);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const initAttemptedRef = useRef(false);
  /** Sliding window of place_changed timestamps for per-session throttle. */
  const selectionTimestampsRef = useRef<number[]>([]);

  const apiKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : undefined;

  useEffect(() => {
    onSelectRef.current = onSelect;
    onChangeRef.current = onChange;
  }, [onSelect, onChange]);

  const extractAddress = useCallback((place: PlaceLike): AddressSuggestion | null => {
    const components = place.address_components;
    if (!components?.length) {
      // Fallback: parse formatted address (already abbreviated by Google)
      if (place.formatted_address) {
        const parts = place.formatted_address.split(",").map(s => s.trim());
        return {
          line1: parts[0] || place.formatted_address,
          city: parts[1] || "",
          state: parts[2]?.split(" ")[0] || "",
          postal_code: parts[2]?.split(" ")[1] || parts[3]?.trim() || "",
        };
      }
      return null;
    }

    let streetNumber = "";
    let route = "";
    let subpremise = "";
    let city = "";
    let state = "";
    let postalCode = "";

    for (const c of components) {
      // Use short_name for street number (usually same as long_name)
      if (c.types.includes("street_number")) streetNumber = c.short_name || c.long_name;
      // Use short_name for route - abbreviated street names work better for validation (e.g., "Los Arboles Ave NE")
      if (c.types.includes("route")) route = c.short_name || c.long_name;
      if (c.types.includes("subpremise")) subpremise = c.long_name;
      // Use long_name for city (full city name)
      if (c.types.includes("locality")) city = c.long_name;
      if (!city && c.types.includes("sublocality_level_1")) city = c.long_name;
      if (!city && c.types.includes("sublocality")) city = c.long_name;
      // Use short_name for state (2-letter code)
      if (c.types.includes("administrative_area_level_1")) state = c.short_name;
      if (c.types.includes("postal_code")) postalCode = c.long_name;
    }

    const line1Raw = [streetNumber, route].filter(Boolean).join(" ").trim();
    // Fallback to formatted_address first segment (already abbreviated)
    const line1 = line1Raw || place.formatted_address?.split(",")[0]?.trim() || "";

    return {
      line1: line1 || place.formatted_address || "",
      line2: subpremise || undefined,
      city,
      state,
      postal_code: postalCode,
    };
  }, []);

  useEffect(() => {
    if (!apiKey || initAttemptedRef.current) {
      return;
    }

    initAttemptedRef.current = true;
    queueMicrotask(() => setIsLoading(true));

    const loadScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.google?.maps?.importLibrary) {
          resolve();
          return;
        }

        const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
        if (existingScript) {
          const checkLoaded = setInterval(() => {
            if (window.google?.maps?.importLibrary) {
              clearInterval(checkLoaded);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkLoaded);
            if (window.google?.maps?.importLibrary) {
              resolve();
            } else {
              reject(new Error("Google Maps script timeout"));
            }
          }, 15000);
          return;
        }

        const script = document.createElement("script");
        script.id = GOOGLE_MAPS_SCRIPT_ID;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          const checkLoaded = setInterval(() => {
            if (window.google?.maps?.importLibrary) {
              clearInterval(checkLoaded);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(checkLoaded);
            if (window.google?.maps?.importLibrary) {
              resolve();
            } else {
              reject(new Error("Google Maps failed to initialize"));
            }
          }, 5000);
        };

        script.onerror = () => {
          reject(new Error("Failed to load Google Maps script"));
        };

        document.head.appendChild(script);
      });
    };

    loadScript()
      .then(() => {
        setIsReady(true);
      })
      .catch((err) => {
        console.warn("Google Autocomplete Element initialization failed:", err);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [apiKey]);

  useEffect(() => {
    if (!isReady || !autocompleteContainerRef.current || autocompleteElementRef.current) {
      return;
    }
    const container = autocompleteContainerRef.current;
    let mounted = true;
    let element: HTMLElement | null = null;
    let handleSelection: ((event: Event) => Promise<void>) | null = null;

    const init = async () => {
      try {
        if (!window.google?.maps?.importLibrary) return;
        await window.google.maps.importLibrary("places");
        if (!mounted || !container) return;

        element = document.createElement("gmp-place-autocomplete");
        element.setAttribute("placeholder", placeholder);
        if (country === "us") {
          element.setAttribute("included-region-codes", "us");
        }
        element.setAttribute("included-primary-types", "street_address");
        element.setAttribute("id", `${id}-google-element`);

        handleSelection = async (event: Event) => {
          const now = Date.now();
          const timestamps = selectionTimestampsRef.current;
          const cutoff = now - PLACE_SELECTIONS_WINDOW_MS;
          selectionTimestampsRef.current = timestamps.filter((t) => t > cutoff);
          if (selectionTimestampsRef.current.length >= PLACE_SELECTIONS_CAP_PER_MINUTE) return;
          selectionTimestampsRef.current.push(now);

          const customEvent = event as Event & {
            placePrediction?: {
              toPlace?: () => { fetchFields?: (input: { fields: string[] }) => Promise<PlaceLike> };
            };
          };
          const place = await customEvent.placePrediction
            ?.toPlace?.()
            ?.fetchFields?.({ fields: ["addressComponents", "formattedAddress"] });
          const normalizedPlace: PlaceLike | null = place
            ? {
                address_components: (place as { addressComponents?: AddressComponent[] }).addressComponents,
                formatted_address: (place as { formattedAddress?: string }).formattedAddress,
              }
            : null;
          const parsed = normalizedPlace ? extractAddress(normalizedPlace) : null;
          if (parsed) {
            onSelectRef.current(parsed);
            onChangeRef.current(parsed.line1);
          }
        };

        element.addEventListener("gmp-select", handleSelection);
        container.innerHTML = "";
        container.appendChild(element);
        autocompleteElementRef.current = element;
      } catch (error) {
        console.warn("Failed to initialize Google Autocomplete Element:", error);
        setHasError(true);
      }
    };

    void init();
    return () => {
      mounted = false;
      if (element && handleSelection) {
        element.removeEventListener("gmp-select", handleSelection);
      }
      container.replaceChildren();
      autocompleteElementRef.current = null;
    };
  }, [country, id, isReady, placeholder, extractAddress]);

  // Common input props
  const inputProps = {
    ref: inputRef,
    id,
    type: "text" as const,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    placeholder,
    disabled,
    "aria-describedby": ariaDescribedBy,
    required,
    "aria-required": required,
  };

  // No API key: render plain input
  if (!apiKey) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Address line 1{required ? " (required)" : ""}</Label>
        <Input {...inputProps} autoComplete="address-line1" />
      </div>
    );
  }

  // Error state: render plain input with warning
  if (hasError) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Address line 1{required ? " (required)" : ""}</Label>
        <Input {...inputProps} autoComplete="address-line1" />
        <p className="text-xs text-amber-700 dark:text-amber-300" role="alert">
          Address suggestions unavailable. Enter your address manually.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Address line 1{required ? " (required)" : ""}</Label>
      <div className="relative space-y-2">
        <Input
          {...inputProps}
          autoComplete="address-line1"
          className={isLoading ? "pr-10" : ""}
        />
        <div
          ref={autocompleteContainerRef}
          className="google-autocomplete-element [&_gmp-place-autocomplete]:w-full"
          aria-hidden={disabled}
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
      </div>
      {ariaDescribedBy && (
        <p className="text-xs text-muted-foreground sr-only" id={ariaDescribedBy}>
          Start typing for suggestions.
        </p>
      )}
      <p className="text-xs text-muted-foreground/80" aria-hidden>
        Powered by Google
      </p>
    </div>
  );
}
