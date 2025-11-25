import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for bus RJ 13 PA 4654...\n')

  const bus = await prisma.bus.findFirst({
    where: { registrationNumber: 'RJ 13 PA 4654' },
    include: {
      primaryDriver: true,
      _count: {
        select: { students: true }
      }
    }
  })

  if (bus) {
    console.log('✅ Bus found:')
    console.log(`   ID: ${bus.id}`)
    console.log(`   Registration: ${bus.registrationNumber}`)
    console.log(`   Capacity: ${bus.seatingCapacity} seats`)
    console.log(`   Driver: ${bus.primaryDriver?.name || 'Not assigned'}`)
    console.log(`   Students: ${bus._count.students}`)
  } else {
    console.log('❌ Bus not found in database')
    console.log('\n💡 Need to create bus RJ 13 PA 4654 for Driver Rajesh')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
