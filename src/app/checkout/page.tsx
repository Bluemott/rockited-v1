"use client";

import { Plus, Minus, X, ShoppingCart, Truck, Loader2, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

import { AddressAutocomplete } from "@/components/checkout/AddressAutocomplete";
import CheckoutSuccess from "@/components/checkout/CheckoutSuccess";
import PaymentElementComponent from "@/components/checkout/PaymentElement";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { ReturnPolicySummary } from "@/components/returns/ReturnPolicySummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { trackBeginCheckout } from "@/lib/analytics";
import { useCartStore } from "@/lib/store";
import type { WooShippingCalculation, WooShippingRate } from "@/lib/types";
import { formatPrice, isValidEmail } from "@/lib/utils";

interface ShippingForm {
  country: string;
  postal_code: string;
  state: string;
  city: string;
  line1: string;
  line2: string;
  name: string;
  email: string;
}

const initialShippingForm: ShippingForm = {
  country: "US",
  postal_code: "",
  state: "",
  city: "",
  line1: "",
  line2: "",
  name: "",
  email: "",
};

function CheckoutContent() {
  const { items, itemCount, updateQuantity, removeItem, _hasHydrated } = useCartStore();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);

  // Step 1: Shipping
  const [shippingForm, setShippingForm] = useState<ShippingForm>(initialShippingForm);
  const [shippingRates, setShippingRates] = useState<WooShippingCalculation | null>(null);
  const [selectedShippingRate, setSelectedShippingRate] = useState<WooShippingRate | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLookingUpCityState, setIsLookingUpCityState] = useState(false);
  const [addressValidatedMessage, setAddressValidatedMessage] = useState<string | null>(null);
  type AddressValidationStatus = "unvalidated" | "valid" | "corrected" | "invalid" | "unverified";
  const [addressValidationStatus, setAddressValidationStatus] = useState<AddressValidationStatus>("unvalidated");
  /** Validated address snapshot; used when building checkout payload so Stripe gets validated address. */
  const [standardizedAddress, setStandardizedAddress] = useState<{
    line1: string;
    city: string;
    state: string;
    postal_code: string;
  } | null>(null);
  const cityStateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const line1InputRef = useRef<HTMLInputElement>(null);
  const calculatingShippingRef = useRef(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!sessionId && items.length > 0) {
      trackBeginCheckout(
        items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: undefined,
        }))
      );
    }
  }, [sessionId, items]);

  // Debounced city/state lookup when ZIP is 5 digits; only autofill when city/state empty
  // Skip while calculating shipping to avoid re-running after validation updates the form
  useEffect(() => {
    if (isCalculatingShipping) return;
    const zip = shippingForm.postal_code.trim().replace(/\D/g, "").slice(0, 5);
    if (shippingForm.country !== "US" || zip.length !== 5) {
      return;
    }
    if (cityStateDebounceRef.current) {
      clearTimeout(cityStateDebounceRef.current);
      cityStateDebounceRef.current = null;
    }
    cityStateDebounceRef.current = setTimeout(() => {
      cityStateDebounceRef.current = null;
      setIsLookingUpCityState(true);
      fetch(`/api/shipping/city-state?zip=${encodeURIComponent(zip)}`)
        .then((res) => (res.ok ? res.json() : { city: null, state: null }))
        .then((data: { city?: string | null; state?: string | null }) => {
          if (data?.city && data?.state) {
            setShippingForm((prev) => ({
              ...prev,
              city: prev.city === "" ? data.city! : prev.city,
              state: prev.state === "" ? data.state! : prev.state,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setIsLookingUpCityState(false));
    }, 350);
    return () => {
      if (cityStateDebounceRef.current) {
        clearTimeout(cityStateDebounceRef.current);
      }
    };
  }, [shippingForm.postal_code, shippingForm.country, isCalculatingShipping]);

  const handleShippingField = (field: keyof ShippingForm, value: string) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
    if (field !== "email") {
      setShippingRates(null);
      setSelectedShippingRate(null);
      setAddressValidatedMessage(null);
      setAddressValidationStatus("unvalidated");
    }
  };

  const addressLocked = ["valid", "corrected", "unverified"].includes(addressValidationStatus);

  const handleChangeAddress = () => {
    setShippingRates(null);
    setSelectedShippingRate(null);
    setAddressValidatedMessage(null);
    setAddressValidationStatus("unvalidated");
    setStandardizedAddress(null);
    line1InputRef.current?.focus();
  };

  const handleValidateAndGetShipping = async () => {
    if (calculatingShippingRef.current) return;
    const zip = shippingForm.postal_code.trim().replace(/\D/g, "").slice(0, 5);
    if (shippingForm.country !== "US" || zip.length !== 5) {
      setError("Please enter a valid US ZIP code.");
      return;
    }
    if (!shippingForm.line1?.trim()) {
      setError("Please enter a street address.");
      return;
    }
    if (!shippingForm.city?.trim() || !shippingForm.state?.trim()) {
      setError("Please enter city and state.");
      return;
    }
    calculatingShippingRef.current = true;
    setIsCalculatingShipping(true);
    setError("");
    setAddressValidatedMessage(null);
    setShippingRates(null);
    setSelectedShippingRate(null);
    try {
      const validateRes = await fetch("/api/address/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line1: shippingForm.line1.trim(),
          line2: shippingForm.line2?.trim() || undefined,
          city: shippingForm.city.trim(),
          state: shippingForm.state.trim().slice(0, 2).toUpperCase(),
          postal_code: zip,
        }),
      });
      const validateData = await validateRes.json().catch(() => ({}));

      if (validateData.valid === false) {
        if (validateData.validationUnavailable === true) {
          setAddressValidationStatus("unverified");
          setAddressValidatedMessage(
            "We couldn't verify this address right now. You can still continue; shipping is calculated by ZIP code."
          );
          // Do not return — continue to fetch shipping rates with entered address
        } else if (validateData.message === "Address validation not configured") {
          setAddressValidationStatus("valid");
        } else {
          setAddressValidationStatus("invalid");
          setAddressValidatedMessage("Address couldn't be verified. Please correct and try again.");
          setError("Address could not be verified. Please correct your address and try again.");
          return;
        }
      }

      if (validateData.valid && validateData.standardized) {
        const s = validateData.standardized;
        const standardized = {
          line1: s.line1 ?? "",
          city: s.city ?? "",
          state: s.state ?? "",
          postal_code: (s.postal_code ?? "").replace(/\D/g, "").slice(0, 5),
        };
        setStandardizedAddress(standardized);
        const normalized = (v: string) => (v || "").trim().toUpperCase();
        const changed =
          normalized(s.line1) !== normalized(shippingForm.line1) ||
          normalized(s.city) !== normalized(shippingForm.city) ||
          normalized(s.state) !== normalized(shippingForm.state) ||
          (s.postal_code || "").trim() !== zip;
        if (changed) {
          setShippingForm((prev) => ({
            ...prev,
            line1: s.line1 ?? prev.line1,
            city: s.city ?? prev.city,
            state: s.state ?? prev.state,
            postal_code: standardized.postal_code,
          }));
          setAddressValidationStatus("corrected");
          setAddressValidatedMessage("Address updated to verified format. Confirm and continue.");
        } else {
          setAddressValidationStatus("valid");
        }
      } else {
        setAddressValidationStatus("valid");
        setStandardizedAddress(null);
      }

      const effectiveState = validateData.standardized?.state ?? shippingForm.state;
      const effectivePostcode = (validateData.standardized?.postal_code ?? zip).replace(/\D/g, "").slice(0, 5);
      const effectiveCity = validateData.standardized?.city ?? shippingForm.city;

      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: shippingForm.country,
          state: effectiveState || undefined,
          postcode: effectivePostcode,
          city: effectiveCity || undefined,
          products: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to calculate shipping");
      }
      const data: WooShippingCalculation = await res.json();
      setShippingRates(data);
      if (data.rates?.length) {
        setSelectedShippingRate(data.rates[0] ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate shipping");
    } finally {
      calculatingShippingRef.current = false;
      setIsCalculatingShipping(false);
    }
  };

  const emailTrimmed = shippingForm.email.trim();
  const emailValid = Boolean(emailTrimmed) && isValidEmail(emailTrimmed);
  const emailError = emailTouched && emailTrimmed && !isValidEmail(emailTrimmed);

  const canContinueToPayment =
    Boolean(shippingForm.name?.trim()) &&
    emailValid &&
    shippingForm.country &&
    shippingForm.postal_code.trim().length >= 5 &&
    selectedShippingRate;

  const handleContinueToPayment = async () => {
    if (!canContinueToPayment) return;
    setIsCreatingSession(true);
    setError("");
    try {
      // Prefer validated address when available so Stripe and fulfillment use it
      const postal_code =
        standardizedAddress?.postal_code ??
        shippingForm.postal_code.trim().replace(/\D/g, "").slice(0, 5);
      const shippingAddress = {
        country: shippingForm.country,
        postal_code,
        state: (standardizedAddress?.state ?? shippingForm.state) || undefined,
        city: (standardizedAddress?.city ?? shippingForm.city) || undefined,
        line1: (standardizedAddress?.line1 ?? shippingForm.line1) || undefined,
        line2: shippingForm.line2 || undefined,
        name: shippingForm.name || undefined,
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerEmail: emailTrimmed,
          shippingAddress,
          selectedShippingRate,
          ...(standardizedAddress && { standardizedAddress }),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.clientSecret) throw new Error("Failed to create checkout session");
      setClientSecret(data.clientSecret);
      if (data.sessionId) setCheckoutSessionId(data.sessionId);
      setCheckoutStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start payment");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    updateQuantity(id, newQuantity);
    if (checkoutStep === 2) {
      setClientSecret("");
      setCheckoutSessionId("");
      setCheckoutStep(1);
    }
    setShippingRates(null);
    setSelectedShippingRate(null);
  };

  const handleRemoveItem = (id: number) => {
    removeItem(id);
    if (checkoutStep === 2) {
      setClientSecret("");
      setCheckoutSessionId("");
      setCheckoutStep(1);
    }
    setShippingRates(null);
    setSelectedShippingRate(null);
  };

  if (sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CheckoutSuccess sessionId={sessionId} />
      </div>
    );
  }

  if (!_hasHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12" data-testid="checkout-loading">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Checkout</h1>
          <p className="text-lg text-muted-foreground mb-8" data-testid="empty-cart-message">
            Your cart is empty
          </p>
          <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <div data-testid="order-summary">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Order Summary</h2>
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Edit Cart
                </Button>
              </Link>
            </div>

            <div className="bg-card rounded-lg shadow-brand-md p-6 border border-border space-y-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    data-testid="checkout-item"
                    className="flex items-start space-x-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                  >
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder-product.jpg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{item.name}</h3>
                      {item.sku && (
                        <p className="text-sm text-muted-foreground mb-2">SKU: {item.sku}</p>
                      )}
                      <p className="text-base font-medium text-foreground">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 1: Shipping form + rates */}
              {checkoutStep === 1 && (
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="ship-name">Full name (required)</Label>
                      <Input
                        ref={nameInputRef}
                        id="ship-name"
                        value={shippingForm.name}
                        onChange={(e) => handleShippingField("name", e.target.value)}
                        placeholder="Jane Doe"
                        required
                        aria-required="true"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="ship-email">Email (required)</Label>
                      <Input
                        id="ship-email"
                        type="email"
                        value={shippingForm.email}
                        onChange={(e) => handleShippingField("email", e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="you@example.com"
                        required
                        aria-required="true"
                        aria-invalid={emailError ? true : undefined}
                        aria-describedby={emailError ? "ship-email-error" : undefined}
                      />
                      {emailError && (
                        <p id="ship-email-error" className="text-sm text-destructive" role="alert">
                          Please enter a valid email address.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <AddressAutocomplete
                        value={shippingForm.line1}
                        onChange={(v) => handleShippingField("line1", v)}
                        onSelect={(address) => {
                          setShippingForm((prev) => ({
                            ...prev,
                            line1: address.line1,
                            line2: address.line2 ?? prev.line2,
                            city: address.city,
                            state: address.state,
                            postal_code: address.postal_code.replace(/\D/g, "").slice(0, 5),
                          }));
                          setShippingRates(null);
                          setSelectedShippingRate(null);
                        }}
                        country="us"
                        disabled={isCalculatingShipping || addressLocked}
                        id="ship-line1"
                        placeholder="Start typing your street address..."
                        inputRef={line1InputRef}
                        ariaDescribedBy="ship-line1-hint"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ship-line2">Address line 2 (optional)</Label>
                      <Input
                        id="ship-line2"
                        value={shippingForm.line2}
                        onChange={(e) => handleShippingField("line2", e.target.value)}
                        placeholder="Apt 4"
                        disabled={addressLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ship-city">City (required)</Label>
                      <div className="relative">
                        <Input
                          id="ship-city"
                          value={shippingForm.city}
                          onChange={(e) => handleShippingField("city", e.target.value)}
                          placeholder="Los Angeles"
                          required
                          aria-required="true"
                          disabled={addressLocked}
                        />
                        {isLookingUpCityState && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            Looking up…
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ship-state">State (required)</Label>
                      <Input
                        id="ship-state"
                        value={shippingForm.state}
                        onChange={(e) => handleShippingField("state", e.target.value)}
                        placeholder="CA"
                        required
                        aria-required="true"
                        disabled={addressLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ship-postal_code">ZIP code (required)</Label>
                      <Input
                        id="ship-postal_code"
                        value={shippingForm.postal_code}
                        onChange={(e) =>
                          handleShippingField("postal_code", e.target.value.replace(/\D/g, "").slice(0, 5))
                        }
                        placeholder="90210"
                        maxLength={5}
                        aria-describedby="zip-hint"
                        required
                        aria-required="true"
                        disabled={addressLocked}
                      />
                      <p id="zip-hint" className="text-xs text-muted-foreground">
                        City and state will be suggested for US ZIP codes.
                      </p>
                    </div>
                  </div>
                  {addressValidatedMessage && (
                    <p
                      className={`text-sm rounded-md px-3 py-2 ${addressValidationStatus === "invalid" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted/50"}`}
                      role="status"
                      aria-live="polite"
                      data-validation-status={addressValidationStatus}
                    >
                      {addressValidatedMessage}
                    </p>
                  )}
                  {(() => {
                    const zip = shippingForm.postal_code.trim().replace(/\D/g, "").slice(0, 5);
                    const canValidateAndGetShipping =
                      Boolean(shippingForm.name?.trim()) &&
                      Boolean(shippingForm.line1?.trim()) &&
                      Boolean(shippingForm.city?.trim()) &&
                      Boolean(shippingForm.state?.trim()) &&
                      shippingForm.country === "US" &&
                      zip.length === 5;
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        {addressLocked ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleChangeAddress}
                          >
                            Change address
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleValidateAndGetShipping}
                              disabled={isCalculatingShipping || !canValidateAndGetShipping}
                            >
                              {isCalculatingShipping ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Validating...
                                </>
                              ) : (
                                "Validate & get shipping"
                              )}
                            </Button>
                            {!canValidateAndGetShipping && (
                              <p className="text-xs text-muted-foreground self-center">
                                Fill name, address, city, state, and 5-digit ZIP to see shipping options.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                  {shippingRates?.rates?.length ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">Select shipping method</p>
                      </div>
                      <div className="space-y-2">
                        {shippingRates.rates.map((rate) => (
                          <label
                            key={rate.method_id}
                            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                              selectedShippingRate?.method_id === rate.method_id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping-rate"
                              checked={selectedShippingRate?.method_id === rate.method_id}
                              onChange={() => setSelectedShippingRate(rate)}
                              className="sr-only"
                            />
                            <div>
                              <span className="font-medium">{rate.method_title}</span>
                              {rate.estimated_delivery && (
                                <p className="text-sm text-muted-foreground">
                                  {rate.estimated_delivery}
                                </p>
                              )}
                            </div>
                            <span className="font-semibold">
                              {formatPrice(rate.cost)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Step 2: Read-only shipping summary */}
              {checkoutStep === 2 && selectedShippingRate && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>
                      Shipping to: {shippingForm.line1}
                      {shippingForm.city && `, ${shippingForm.city}`}
                      {shippingForm.state && `, ${shippingForm.state}`}{" "}
                      {shippingForm.postal_code}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedShippingRate.method_title} — {formatPrice(selectedShippingRate.cost)}
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-foreground">
                    {selectedShippingRate
                      ? formatPrice(selectedShippingRate.cost)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-success">Calculated at payment</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">
                    {formatPrice(
                      subtotal + Number(selectedShippingRate?.cost ?? 0)
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Final total includes shipping and tax
                </p>
              </div>
            </div>

          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold text-primary mb-2">Secure Checkout</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your payment information is encrypted and secure with Stripe.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground" role="group" aria-label="Security and payment trust">
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" aria-hidden />
                <span>SSL encrypted</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                <span>Secure payment</span>
              </span>
              <span>Payments secured by Stripe</span>
            </div>
          </div>

          <ReturnPolicySummary variant="inline" />

          <div className="bg-card rounded-lg shadow-brand-md p-6 border border-border">
                {checkoutStep === 1 ? (
                  <>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Shipping &amp; payment
                    </h2>
                    {error && (
                      <div
                        className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4"
                        role="alert"
                        data-testid="checkout-error"
                      >
                        <p className="text-destructive text-sm">{error}</p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">
                      {canContinueToPayment
                        ? "Review your order above and click below to continue to payment."
                        : selectedShippingRate
                          ? "Enter your full name and email above to continue."
                          : "Fill in your shipping address, click &quot;Validate & get shipping&quot;, then choose a shipping method."}
                    </p>
                    {isCreatingSession ? (
                      <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground" data-testid="checkout-loading-payment">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading payment…</span>
                      </div>
                    ) : (
                      <Button
                        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                        onClick={handleContinueToPayment}
                        disabled={!canContinueToPayment}
                      >
                        Continue to payment
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <h2 className="text-xl font-semibold text-foreground">Payment</h2>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => {
                          setCheckoutStep(1);
                          setClientSecret("");
                          setCheckoutSessionId("");
                          // Keep shippingRates and selectedShippingRate so user can change method or address
                        }}
                      >
                        Change shipping address or method
                      </Button>
                    </div>
                    {error && (
                      <div
                        className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4"
                        role="alert"
                        data-testid="checkout-error"
                      >
                        <p className="text-destructive text-sm">{error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.location.reload()}
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                    {clientSecret && (
                      <div className="space-y-4" data-testid="checkout-payment-ready">
                        <PaymentElementComponent
                          clientSecret={clientSecret}
                          sessionId={checkoutSessionId}
                          shippingAlreadyCollected
                          customerEmail={emailTrimmed || undefined}
                          shippingAddressForBilling={{
                            name: shippingForm.name || undefined,
                            line1: shippingForm.line1 || undefined,
                            line2: shippingForm.line2 || undefined,
                            city: shippingForm.city || undefined,
                            state: shippingForm.state || undefined,
                            postal_code: shippingForm.postal_code.trim().replace(/\D/g, "").slice(0, 5) || undefined,
                            country: shippingForm.country || "US",
                          }}
                        />
                        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground" role="status">
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                          <span>Encrypted and secure</span>
                        </p>
                      </div>
                    )}
                  </>
                )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <CheckoutContent />
    </Suspense>
  );
}
