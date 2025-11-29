const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const buses = await prisma.bus.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, registrationNumber: true }
  })
  console.log('Buses in order of creation:')
  for (let i = 0; i < buses.length; i++) {
    console.log(`${i+1}. ${buses[i].registrationNumber}`)
  }
}

main().then(() => prisma.$disconnect())
