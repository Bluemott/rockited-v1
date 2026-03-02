/**
 * PO Box detection: we do not ship to PO boxes.
 * Normalizes line (uppercase, collapse spaces) and checks common patterns.
 */

const PO_BOX_PATTERNS = [
  /\bP\.?\s*O\.?\s*BOX\b/i,
  /\bPO\s*BOX\b/i,
  /\bPOST\s+OFFICE\s+BOX\b/i,
  /\bPOBOX\b/i,
];

/**
 * Normalize a line for PO Box check: uppercase, collapse multiple spaces to one, trim.
 */
function normalizeLine(line: string): string {
  return (line || "").trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Returns true if the given line (street address line 1 or 2) looks like a PO Box.
 */
export function isPoBoxLine(line: string): boolean {
  const normalized = normalizeLine(line);
  if (!normalized) return false;
  return PO_BOX_PATTERNS.some((re) => re.test(normalized));
}

/**
 * Returns true if line1 or line2 (optional) looks like a PO Box.
 */
export function isPoBoxAddress(line1: string, line2?: string): boolean {
  return isPoBoxLine(line1) || (line2 ? isPoBoxLine(line2) : false);
}
