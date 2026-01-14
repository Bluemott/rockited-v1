'use client';

const CONSENT_KEY = 'cookie-consent';
const CONSENT_EXPIRY_DAYS = 365;

export type ConsentStatus = 'accepted' | 'declined' | null;

/**
 * Get the current cookie consent status
 */
export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') return null;
  
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) return null;
    
    const { status, expiry } = JSON.parse(consent);
    
    // Check if consent has expired
    if (expiry && new Date(expiry) < new Date()) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    
    return status as ConsentStatus;
  } catch (error) {
    console.error('Error reading consent status:', error);
    return null;
  }
}

/**
 * Set the cookie consent status
 */
export function setConsentStatus(status: 'accepted' | 'declined'): void {
  if (typeof window === 'undefined') return;
  
  try {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CONSENT_EXPIRY_DAYS);
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      status,
      expiry: expiry.toISOString(),
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error setting consent status:', error);
  }
}

/**
 * Check if analytics cookies are allowed
 */
export function hasAnalyticsConsent(): boolean {
  return getConsentStatus() === 'accepted';
}

/**
 * Clear consent (for testing or user preference changes)
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_KEY);
}

