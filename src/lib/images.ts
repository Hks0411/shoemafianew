/** Storefront image URLs. Photos are stored in MySQL and served from /api/media/:id. */

export function optimizedImageUrl(url: string | null | undefined, _width: number) {

  if (!url) return "";

  return url;

}

