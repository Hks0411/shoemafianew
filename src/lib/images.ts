/** Storefront image URLs. MySQL blobs are served from /api/media/:id; legacy Cloudinary URLs still work. */
export function optimizedImageUrl(url: string | null | undefined, width: number) {
  if (!url) return "";
  if (url.startsWith("/api/media/")) return url;
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const prefix = url.slice(0, index + marker.length);
  const rest = url.slice(index + marker.length);
  if (rest.startsWith("f_auto") || rest.startsWith("q_auto") || rest.startsWith("c_")) return url;
  return `${prefix}f_auto,q_auto,c_fill,w_${width}/${rest}`;
}
