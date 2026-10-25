export type CartItem = {
  variationId: string;
  productId: string;
  name: string;
  size: string;
  price: number;
  image?: string;
  quantity: number;
};

const KEY = "shoe-mafia-cart";

function normalizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is CartItem =>
      Boolean(row) &&
      typeof row === "object" &&
      typeof (row as CartItem).variationId === "string" &&
      typeof (row as CartItem).productId === "string" &&
      typeof (row as CartItem).quantity === "number" &&
      Number.isFinite((row as CartItem).quantity),
  );
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    const items = normalizeCart(parsed);
    if (!Array.isArray(parsed) || items.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
      localStorage.setItem(KEY, JSON.stringify(items));
    }
    return items;
  } catch {
    localStorage.removeItem(KEY);
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-changed"));
}

export function addToCart(item: CartItem) {
  const items = readCart();
  const existing = items.find((row) => row.variationId === item.variationId);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  writeCart(items);
}

export function cartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal() {
  return readCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}
