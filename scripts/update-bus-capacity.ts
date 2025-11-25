import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Updating bus capacity...')

  const bus = await prisma.bus.update({
    where: { id: 'cmidgrmgt000djcdelunrp6pt' },
    data: {
      seatingCapacity: 60,
    },
  })

  console.log(`✅ Bus ${bus.registrationNumber} capacity updated to ${bus.seatingCapacity} seats`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
