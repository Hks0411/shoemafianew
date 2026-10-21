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

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[];
  } catch {
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
