import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

interface BusData {
  driver_name: string
  registration_number: string
}

async function main() {
  console.log('🚌 Importing buses from Excel file...')
  console.log('=' .repeat(60))

  // Read the buses data
  const busesData: BusData[] = JSON.parse(
    fs.readFileSync('/tmp/buses_import.json', 'utf-8')
  )

  // Step 1: Delete all existing buses
  console.log('\n🗑️  Deleting existing buses...')
  const deleteResult = await prisma.bus.deleteMany()
  console.log(`   Deleted ${deleteResult.count} existing buses`)

  // Step 2: Get all drivers to match by name
  const drivers = await prisma.driver.findMany({
    select: { id: true, name: true }
  })

  const driverMap = new Map(drivers.map(d => [d.name.toLowerCase().trim(), d.id]))

  console.log('\n🚌 Creating new buses...')
  console.log('-' .repeat(60))

  let created = 0
  let skipped = 0

  for (let i = 0; i < busesData.length; i++) {
    const busData = busesData[i]

    try {
      // Normalize registration number (remove extra spaces)
      const regNumber = busData.registration_number.replace(/\s+/g, ' ').trim()

      // Find matching driver
      const driverName = busData.driver_name.toLowerCase().trim()
      const driverId = driverMap.get(driverName)

      // Generate chassis number (using registration number + index)
      const chassisNumber = `CH${regNumber.replace(/\s/g, '')}${i}`

      const bus = await prisma.bus.create({
        data: {
          registrationNumber: regNumber,
          chassisNumber: chassisNumber,
          seatingCapacity: 40, // Default capacity
          purchaseDate: new Date('2020-01-01'), // Default purchase date
          primaryDriverId: driverId || null,
        },
      })

      console.log(`✅ Created: ${bus.registrationNumber} -> ${busData.driver_name}${driverId ? '' : ' (driver not found)'}`)
      created++
    } catch (error: any) {
      console.log(`⚠️  Skipped ${busData.registration_number}: ${error.message}`)
      skipped++
    }
  }

  console.log('=' .repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   Created: ${created} buses`)
  console.log(`   Skipped: ${skipped} buses`)
  console.log(`\n✅ All buses processed successfully!`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
