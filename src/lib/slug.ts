export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 72);
  return base || "product";
}

export function uniqueSlug(base: string, suffix: string): string {
  return `${slugify(base)}-${suffix.slice(-8).toLowerCase()}`;
}
