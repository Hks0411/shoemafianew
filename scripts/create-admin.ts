import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureStoreCategories } from "../src/lib/categories";

const prisma = new PrismaClient();

async function main() {
  await ensureStoreCategories(prisma);
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const email = (process.env.ADMIN_EMAIL?.trim() || `${(username || "admin").toLowerCase()}@shoemaafia.local`).toLowerCase();
  if (!username || !password) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD in the environment before running setup:admin.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.upsert({
    where: { username },
    create: {
      username,
      email,
      name: "Shoe Mafia Admin",
      passwordHash,
    },
    update: {
      email,
      passwordHash,
    },
  });
  console.log(`Admin ready: ${admin.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
