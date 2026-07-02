import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.item.count();
  if (count > 0) {
    console.log(`Items already present (${count}); skipping seed.`);
    return;
  }
  await prisma.item.createMany({
    data: [
      { title: "First item — served by Nest.js" },
      { title: "Stored in Postgres via Prisma" },
      { title: "Local in Docker, Neon in the cloud" },
    ],
  });
  console.log("Seeded 3 items.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
