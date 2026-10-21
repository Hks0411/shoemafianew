import Link from "next/link";
import { formatInr, effectivePrice, fromDecimal } from "@/lib/money";
import { optimizedImageUrl } from "@/lib/images";

type MoneyValue = string | number | { toString(): string } | null | undefined;
type Variation = { size: string; price: MoneyValue; salePrice?: MoneyValue; available: number };
type Product = {
  id: string;
  slug: string;
  name: string;
  images: Array<{ url: string }>;
  variations: Variation[];
};

export function ProductCard({ product }: { product: Product }) {
  const prices = product.variations.map((v) => effectivePrice(fromDecimal(v.price), fromDecimal(v.salePrice)));
  const from = prices.length ? Math.min(...prices) : 0;
  const sizes = product.variations.filter((v) => v.available > 0).map((v) => v.size);
  const soldOut = product.variations.every((v) => v.available <= 0);
  const image = optimizedImageUrl(product.images[0]?.url, 600);

  return (
    <Link href={`/product/${product.slug}`} className="soft-card group overflow-hidden">
      <div className="relative aspect-[4/5] bg-mint">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Photo coming soon</div>
        )}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-charcoal px-3 py-1 text-xs text-white">Sold out</span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-forest">{product.name}</h3>
        <p className="mt-1 text-sm text-muted">{from ? `From ${formatInr(from)}` : "Price on request"}</p>
        <p className="mt-2 text-xs tracking-wide text-emerald">
          {sizes.length ? `Sizes ${sizes.join(", ")}` : "No sizes in stock"}
        </p>
      </div>
    </Link>
  );
}
