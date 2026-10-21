export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

export function fromDecimal(value: { toString(): string } | number | string | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function effectivePrice(price: number, salePrice: number | null | undefined): number {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}
