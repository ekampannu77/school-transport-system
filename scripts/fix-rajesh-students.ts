import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BUS_ID = 'cmidgrns1000rjcdest3gqkqn'

async function main() {
  console.log('🔧 Fixing Rajesh students...')
  console.log('='.repeat(70))

  // Step 1: Update bus capacity
  console.log('\n📏 Step 1: Updating bus capacity to 45 seats')
  await prisma.bus.update({
    where: { id: BUS_ID },
    data: { seatingCapacity: 45 }
  })
  console.log('✅ Bus capacity updated to 45 seats')

  // Step 2: Fix Jigar Arora's class from IX to 9
  console.log('\n🔄 Step 2: Fixing class format for Jigar Arora')
  const jigar = await prisma.student.findFirst({
    where: {
      name: 'Jigar Arora',
      busId: BUS_ID
    }
  })

  if (jigar) {
    await prisma.student.update({
      where: { id: jigar.id },
      data: { class: '9' }
    })
    console.log('✅ Jigar Arora class updated: IX → 9')
  }

  // Step 3: Check current student count
  const count = await prisma.student.count({ where: { busId: BUS_ID } })
  console.log(`\n📊 Current student count: ${count}`)

  console.log('\n✅ All fixes applied!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
