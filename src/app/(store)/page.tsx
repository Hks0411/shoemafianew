import Link from "next/link";
import { prisma } from "@/lib/db";
import { STORE } from "@/lib/store";
import { ProductCard } from "@/components/store/ProductCard";
import { Logo } from "@/components/brand/Logo";
import { DatabaseSetupPanel } from "@/components/store/DatabaseSetupPanel";
import { databaseConfigHint, describeDatabaseError } from "@/lib/database-issue";

export const dynamic = "force-dynamic";

const HOME_PRODUCT_LIMIT = 10;

export default async function HomePage() {
  const configHint = databaseConfigHint();
  if (configHint) {
    return <DatabaseSetupPanel detail={configHint} />;
  }

  let banners;
  let homeProducts;
  let productTotal;
  let testimonials;
  let categories;
  try {
    [banners, homeProducts, productTotal, testimonials, categories] = await Promise.all([
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variations: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: HOME_PRODUCT_LIMIT,
    }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);
  } catch (error) {
    return <DatabaseSetupPanel detail={describeDatabaseError(error)} />;
  }

  const hero = banners[0];

  return (
    <div>
      <section className="hero-grid relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-bright">Footwear · Bilaspur</p>
            <Logo className="mt-6 h-28 w-28 md:h-36 md:w-36" />
            <h1 className="sr-only">{STORE.name}</h1>
            <p className="mt-4 max-w-md text-lg text-white/80">
              A premium shoe store at {STORE.address}. Shop new arrivals online or visit us at the bus stand.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-white px-6 py-3 font-medium text-forest shadow-lg">
                Shop the catalog
              </Link>
              <a href={`tel:${STORE.phoneTel}`} className="rounded-full border border-white/30 px-6 py-3">
                Call {STORE.phone}
              </a>
            </div>
          </div>
          <div className="soft-card overflow-hidden bg-forest-deep/40 p-0">
            {hero?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.imageUrl} alt={hero.title} className="h-full max-h-[420px] w-full object-cover" />
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
                <Logo className="h-40 w-40 md:h-48 md:w-48" />
                <p className="text-sm text-white/70">Add homepage banners in the admin panel, or keep this brand mark.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {categories.length ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="display text-3xl text-forest">Collections</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link key={category.id} href={`/shop?category=${category.slug}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm">
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display text-3xl text-forest">Shop shoes</h2>
            <p className="mt-1 text-sm text-muted">
              Showing {homeProducts.length} of {productTotal} products
            </p>
          </div>
          {productTotal > HOME_PRODUCT_LIMIT ? (
            <Link
              href="/shop"
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white"
            >
              Shop more
            </Link>
          ) : null}
        </div>
        {homeProducts.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {productTotal > HOME_PRODUCT_LIMIT ? (
              <div className="mt-10 text-center">
                <Link
                  href="/shop"
                  className="inline-flex rounded-full border border-line bg-white px-8 py-3 font-medium text-forest shadow-sm hover:border-emerald"
                >
                  Shop more — see all {productTotal} products
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty-state">The catalog is empty until products are added or imported from Busy.</div>
        )}
      </section>

      <section className="bg-mint/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="display text-3xl text-forest">Visit the store</h2>
            <p className="mt-4 max-w-md text-muted">{STORE.address}</p>
            <p className="mt-2 text-forest">{STORE.phone}</p>
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              className="mt-6 inline-flex rounded-full bg-forest px-5 py-3 text-white"
            >
              WhatsApp the shop
            </a>
          </div>
          <div className="soft-card p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald">Bilaspur, Chhattisgarh</p>
            <p className="mt-3 text-lg">Bus Stand, Old Telephone Exchange Road, Telipara.</p>
            <p className="mt-2 text-sm text-muted">Online catalog stays empty until you add or import real products. No sample inventory is shown.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="display text-3xl text-forest">What customers say</h2>
        {testimonials.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote key={item.id} className="soft-card p-6">
                <p className="text-sm text-muted">{"★".repeat(item.rating)}</p>
                <p className="mt-3">{item.body}</p>
                <footer className="mt-4 text-sm font-medium text-forest">{item.authorName}</footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="empty-state mt-6">
            No store testimonials yet. After a delivered order, customers can submit a review from their order link.
          </div>
        )}
      </section>
    </div>
  );
}
