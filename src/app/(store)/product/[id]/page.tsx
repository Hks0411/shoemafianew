import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductDetail } from "@/components/store/ProductDetail";
import { ProductCard } from "@/components/store/ProductCard";
import { fromDecimal } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: id }, { id }], status: "ACTIVE" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variations: { orderBy: { size: "asc" } },
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) notFound();

  const related = product.categoryId
    ? await prisma.product.findMany({
        where: { categoryId: product.categoryId, id: { not: product.id }, status: "ACTIVE" },
        include: { images: { take: 1 }, variations: true },
        take: 4,
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ProductDetail
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
          variations: product.variations.map((v) => ({
            id: v.id,
            size: v.size,
            price: fromDecimal(v.price),
            salePrice: v.salePrice == null ? null : fromDecimal(v.salePrice),
            available: v.available,
            barcode: v.barcode,
          })),
        }}
      />
      {product.reviews.length ? (
        <section className="mt-12">
          <h2 className="display text-2xl text-forest">Reviews</h2>
          <div className="mt-4 grid gap-4">
            {product.reviews.map((review) => (
              <article key={review.id} className="soft-card p-5">
                <p className="text-sm text-emerald">{"★".repeat(review.rating)} {review.verified ? "Verified purchase" : ""}</p>
                <p className="mt-2">{review.body}</p>
                <p className="mt-2 text-sm text-muted">{review.authorName}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {related.length ? (
        <section className="mt-12">
          <h2 className="display text-2xl text-forest">Related</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
