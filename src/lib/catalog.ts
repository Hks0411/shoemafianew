import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findCatalogProducts<TInclude extends Prisma.ProductInclude>(args: {
  where: Prisma.ProductWhereInput;
  sort?: string;
  skip: number;
  take: number;
  include: TInclude;
}) {
  const { where, sort, skip, take, include } = args;
  const createdOrder: Prisma.ProductOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  if (sort !== "price-asc" && sort !== "price-desc") {
    return prisma.product.findMany({ where, include, orderBy: createdOrder, skip, take });
  }

  const grouped = await prisma.productVariation.groupBy({
    by: ["productId"],
    where: { product: where },
    _min: { price: true },
    orderBy: { _min: { price: sort === "price-asc" ? "asc" : "desc" } },
    skip,
    take,
  });

  const ids = grouped.map((row) => row.productId);
  if (!ids.length) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include,
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}
