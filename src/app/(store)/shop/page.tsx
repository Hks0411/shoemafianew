import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/store/ProductCard";
import { findCatalogProducts } from "@/lib/catalog";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; size?: string; sort?: string; page?: string; min?: string; max?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 12;
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { itemCode: { contains: params.q } },
      { variations: { some: { OR: [{ barcode: params.q }, { sku: { contains: params.q } }] } } },
    ];
  }
  if (params.category) where.category = { slug: params.category };
  const variationSome: Prisma.ProductVariationWhereInput = {};
  if (params.size) variationSome.size = params.size;
  const priceFilter: Prisma.DecimalFilter = {};
  if (params.min) priceFilter.gte = Number(params.min);
  if (params.max) priceFilter.lte = Number(params.max);
  if (Object.keys(priceFilter).length) variationSome.price = priceFilter;
  if (Object.keys(variationSome).length) where.variations = { some: variationSome };

  const [total, items, categories, sizes] = await Promise.all([
    prisma.product.count({ where }),
    findCatalogProducts({
      where,
      sort: params.sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { images: { take: 1, orderBy: { sortOrder: "asc" as const } }, variations: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.productVariation.findMany({ distinct: ["size"], select: { size: true }, orderBy: { size: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="display text-4xl text-forest">Shop</h1>
      <form className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-6">
        <input name="q" defaultValue={params.q} placeholder="Search" className="rounded-xl border border-line px-3 py-2" />
        <select name="category" defaultValue={params.category ?? ""} className="rounded-xl border border-line px-3 py-2">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="size" defaultValue={params.size ?? ""} className="rounded-xl border border-line px-3 py-2">
          <option value="">All sizes</option>
          {sizes.map((s) => (
            <option key={s.size} value={s.size}>{s.size}</option>
          ))}
        </select>
        <input name="min" defaultValue={params.min} placeholder="Min ₹" className="rounded-xl border border-line px-3 py-2" />
        <input name="max" defaultValue={params.max} placeholder="Max ₹" className="rounded-xl border border-line px-3 py-2" />
        <select name="sort" defaultValue={params.sort ?? "newest"} className="rounded-xl border border-line px-3 py-2">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <button className="rounded-xl bg-forest px-3 py-2 text-white md:col-span-6">Filter</button>
      </form>
      <p className="mt-4 text-sm text-muted">{total} products</p>
      {items.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state mt-8">No products match this search yet.</div>
      )}
      {pages > 1 ? (
        <div className="mt-8 flex gap-2">
          {Array.from({ length: pages }).slice(0, 12).map((_, i) => (
            <a
              key={i}
              href={`/shop?q=${encodeURIComponent(params.q ?? "")}&category=${params.category ?? ""}&size=${params.size ?? ""}&sort=${params.sort ?? ""}&min=${params.min ?? ""}&max=${params.max ?? ""}&page=${i + 1}`}
              className={`rounded-full px-3 py-1 text-sm ${page === i + 1 ? "bg-forest text-white" : "border border-line"}`}
            >
              {i + 1}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
