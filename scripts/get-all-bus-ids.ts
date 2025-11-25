import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const buses = await prisma.bus.findMany({
    include: {
      primaryDriver: true,
      _count: {
        select: { students: true }
      }
    },
    orderBy: { registrationNumber: 'asc' }
  })

  console.log('# Bus IDs for import scripts')
  console.log('BUS_IDS = {')
  buses.forEach(bus => {
    const driverName = bus.primaryDriver?.name || 'Unknown'
    const students = bus._count.students
    console.log(`    '${bus.registrationNumber}': {'id': '${bus.id}', 'driver': '${driverName}', 'students': ${students}},`)
  })
  console.log('}')
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
