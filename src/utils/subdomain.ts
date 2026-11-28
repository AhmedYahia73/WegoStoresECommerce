/**
 * Normalizes a tenant subdomain input into the backend `api-<name>` format.
 * Examples:
 * - "zara" -> "api-zara"
 * - "Zara " -> "api-zara"
 * - "api-zara" -> "api-zara"
 */
export function formatApiSubdomain(rawSubdomain: string): string {
  const cleaned = rawSubdomain.trim().toLowerCase();
  if (!cleaned) return "";
  return cleaned.startsWith("api-") ? cleaned : `api-${cleaned}`;
}

/**
 * Extracts the raw storefront name without the `api-` prefix.
 */
export function stripApiPrefix(subdomain: string): string {
  const cleaned = subdomain.trim().toLowerCase();
  return cleaned.startsWith("api-") ? cleaned.slice(4) : cleaned;
}
