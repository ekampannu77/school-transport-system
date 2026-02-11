import { prisma } from '../src/lib/prisma';

async function main() {
  const buses = await prisma.bus.findMany({
    take: 5,
    include: {
      primaryDriver: {
        select: {
          name: true,
        },
      },
    },
  });
  console.log(JSON.stringify(buses, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
