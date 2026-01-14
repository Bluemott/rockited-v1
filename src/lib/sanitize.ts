/**
 * Input sanitization utilities for preventing XSS, injection attacks, and other security issues
 */

/**
 * Sanitize a string to prevent XSS attacks
 * Removes potentially dangerous HTML/JavaScript while preserving safe content
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
    .replace(/&#/g, '') // Remove HTML entities that could be used for XSS
    .trim();
}

/**
 * Sanitize HTML content (more permissive than sanitizeString)
 * Allows basic HTML but removes dangerous elements and attributes
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data URIs that could contain HTML
    .trim();
}

/**
 * Sanitize email address
 * Validates and sanitizes email format
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Basic email validation and sanitization
  const email = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Additional checks for dangerous patterns
  if (email.includes('<') || email.includes('>') || email.includes('javascript:')) {
    throw new Error('Email contains invalid characters');
  }

  return email;
}

/**
 * Sanitize URL
 * Validates and sanitizes URL format
 */
export function sanitizeURL(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const url = input.trim();

  // Only allow http and https protocols
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('URL must use http:// or https:// protocol');
  }

  // Remove dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (url.toLowerCase().includes(protocol)) {
      throw new Error('URL contains dangerous protocol');
    }
  }

  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize numeric input
 * Validates and sanitizes numeric values
 */
export function sanitizeNumber(input: unknown, min?: number, max?: number): number {
  const num = typeof input === 'number' ? input : Number(input);

  if (isNaN(num)) {
    throw new Error('Invalid number');
  }

  if (min !== undefined && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`Number must be at most ${max}`);
  }

  return num;
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: unknown, min?: number, max?: number): number {
  const num = sanitizeNumber(input, min, max);
  
  if (!Number.isInteger(num)) {
    throw new Error('Value must be an integer');
  }

  return num;
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;

  for (const key in obj) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    // Recursively sanitize nested objects
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      sanitized[key] = sanitizeObjectKeys(obj[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(input: unknown[]): string[] {
  if (!Array.isArray(input)) {
    throw new Error('Input must be an array');
  }

  return input
    .filter((item) => typeof item === 'string')
    .map((item) => sanitizeString(item as string))
    .filter((item) => item.length > 0);
}

/**
 * Validate and sanitize request body size
 * Throws error if body exceeds maximum size
 */
export function validateBodySize(body: string, maxSize: number = 1024 * 1024): void {
  // 1MB default max size
  if (body.length > maxSize) {
    throw new Error(`Request body exceeds maximum size of ${maxSize} bytes`);
  }
}

/**
 * Sanitize SQL injection patterns (for logging/display purposes)
 * Note: This is NOT a replacement for parameterized queries
 */
export function sanitizeSQLPattern(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove common SQL injection patterns
  return input
    .replace(/('|(\\')|(;)|(\\)|(\/\*)|(\*\/)|(\-\-)|(\+)|(\|)|(\&)|(\%)|(\$)|(\@)|(\!)|(\^)|(\~)|(\`)|(\[)|(\])|(\{)|(\})|(\()|(\))|(\=)|(\>)|(\<)|(\?)|(\:)|(\;)|(\,)|(\/)|(\\)|(\*)|(\")/g, '')
    .trim();
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .trim();
}
