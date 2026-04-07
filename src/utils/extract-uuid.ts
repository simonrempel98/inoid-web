/**
 * Extrahiert eine UUID aus einem beliebigen String.
 * Unterstützt alte NFC-Tag URLs wie: https://alter-link.com/UUID
 *
 * @example
 * extractUUID("https://old-system.com/abc/550e8400-e29b-41d4-a716-446655440000")
 * // → "550e8400-e29b-41d4-a716-446655440000"
 *
 * extractUUID("550e8400-e29b-41d4-a716-446655440000")
 * // → "550e8400-e29b-41d4-a716-446655440000"
 *
 * extractUUID("kein-uuid-hier")
 * // → null
 */
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export function extractUUID(raw: string): string | null {
  if (!raw) return null
  const match = raw.match(UUID_REGEX)
  return match ? match[0].toLowerCase() : null
}
