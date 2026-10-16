/**
 * Generates an SEO-friendly URL slug from place name and area
 */
export function generateSlug(name: string, area: string): string {
  const combined = `${name} ${area}`;
  let slug = combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphen
    .replace(/-+/g, '-'); // collapse multiple hyphens

  if (!slug) {
    slug = 'tempat-makan';
  }

  // Append a short random identifier to prevent collisions
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}
