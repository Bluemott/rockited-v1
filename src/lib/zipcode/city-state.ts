/**
 * City/state lookup by 5-digit US ZIP via Zippopotam (free, no API key).
 * Used for checkout and shipping estimator autofill.
 */

const ZIPPO_BASE = "https://api.zippopotam.us";
const CACHE_MAX = 500;
const cache = new Map<string, { city: string; state: string }>();

interface ZippopotamPlace {
  "place name"?: string;
  "state abbreviation"?: string;
  state?: string;
}

interface ZippopotamResponse {
  places?: ZippopotamPlace[];
}

/**
 * Returns city and state for a 5-digit US ZIP, or null if not found.
 * Results are cached in memory to avoid repeated requests.
 */
export async function getCityStateByZip(
  zip5: string
): Promise<{ city: string; state: string } | null> {
  const trimmed = zip5.trim().replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(trimmed)) return null;

  const cached = cache.get(trimmed);
  if (cached) return cached;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${ZIPPO_BASE}/us/${trimmed}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = (await res.json()) as ZippopotamResponse;
    const place = data.places?.[0];
    const city = place?.["place name"]?.trim();
    const state = place?.["state abbreviation"]?.trim() ?? place?.state?.trim().slice(0, 2);

    if (!city || !state) return null;

    const result = { city, state };
    if (cache.size >= CACHE_MAX) {
      const firstKey = cache.keys().next().value;
      if (firstKey != null) cache.delete(firstKey);
    }
    cache.set(trimmed, result);
    return result;
  } catch {
    return null;
  }
}
