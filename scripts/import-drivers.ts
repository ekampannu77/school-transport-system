import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const drivers = [
  { name: 'Bhupinder Singh', phone: '+91-9876000001' },
  { name: 'Harbans Singh', phone: '+91-9876000002' },
  { name: 'Labh Singh', phone: '+91-9876000003' },
  { name: 'Bhola Singh', phone: '+91-9876000004' },
  { name: 'Mahma Singh', phone: '+91-9876000005' },
  { name: 'Omparkash', phone: '+91-9876000006' },
  { name: 'Gursher Singh', phone: '+91-9876000007' },
  { name: 'Manjeet Singh', phone: '+91-9876000008' },
  { name: 'Ram Singh', phone: '+91-9876000009' },
  { name: 'Satnam Singh', phone: '+91-9876000010' },
  { name: 'Lal Singh', phone: '+91-9876000011' },
  { name: 'Kuldeep Singh', phone: '+91-9876000012' },
  { name: 'Jaswant Singh', phone: '+91-9876000013' },
  { name: 'Manjinder Singh', phone: '+91-9876000014' },
  { name: 'Jasveer Singh', phone: '+91-9876000015' },
  { name: 'Jaspal Singh', phone: '+91-9876000016' },
  { name: 'Nanak Singh', phone: '+91-9876000017' },
  { name: 'Kamaljeet Singh', phone: '+91-9876000018' },
  { name: 'Rajesh', phone: '+91-9876000019' },
  { name: 'Baldev Singh', phone: '+91-9876000020' },
  { name: 'Mohan Lal', phone: '+91-9876000021' },
  { name: 'Bhupinder Singh 32 ML', phone: '+91-9876000022' },
  { name: 'Rajwant Singh', phone: '+91-9876000023' },
  { name: 'Anil', phone: '+91-9876000024' },
  { name: 'Gurjant Singh', phone: '+91-9876000025' },
  { name: 'Jagtar Singh', phone: '+91-9876000026' },
]

async function main() {
  console.log('🚗 Creating drivers from Excel file...')
  console.log('=' .repeat(60))
  
  let created = 0
  let skipped = 0
  
  for (const driverData of drivers) {
    try {
      const driver = await prisma.driver.create({
        data: {
          name: driverData.name,
          role: 'driver',
          phone: driverData.phone,
          status: 'active',
        },
      })
      console.log(`✅ Created driver: ${driver.name}`)
      created++
    } catch (error: any) {
      console.log(`⚠️  Skipped ${driverData.name}: Already exists`)
      skipped++
    }
  }
  
  console.log('=' .repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   Created: ${created} drivers`)
  console.log(`   Skipped: ${skipped} drivers`)
  console.log(`\n✅ All drivers processed successfully!`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
