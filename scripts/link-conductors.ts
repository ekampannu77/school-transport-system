const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Conductors in order from Excel (Bus 1 = index 0, Bus 2 = index 1, etc.)
const conductorsByBusOrder: string[] = [
  'Sandeep Kaur',   // Bus 1
  'Moni Devi',      // Bus 2
  'Kamlesh Kaur',   // Bus 3
  'Nisha',          // Bus 4
  'Renu Rani',      // Bus 5
  'Makhan Singh',   // Bus 6
  'Sachin',         // Bus 7
  'Kiranpal Kaur',  // Bus 8
  'Gursewak Singh', // Bus 9
  'Mamta',          // Bus 10
  'Binder Kaur',    // Bus 11
  'Ashminder Singh',// Bus 12
  'Mehar Singh',    // Bus 13
  'Jagjeet Kour',   // Bus 14
  'Amrit Lal',      // Bus 15
  'Jagseer Singh',  // Bus 16
  'Kiranjeet Kaur', // Bus 17
  'Kulwinder Kaur', // Bus 18
  'Ramandeep Kaur', // Bus 19
  'Jagmeet Singh',  // Bus 20
  'Labh Singh',     // Bus 21
  'Krishna Devi',   // Bus 22
]

async function main() {
  console.log('Linking conductors to buses...\n')

  // Get all buses ordered by creation date (this matches the Excel bus numbers)
  const buses = await prisma.bus.findMany({
    select: { id: true, registrationNumber: true },
    orderBy: { createdAt: 'asc' }
  })
  console.log(`Found ${buses.length} buses`)

  // Get all conductors
  const conductors = await prisma.driver.findMany({
    where: { role: 'conductor' },
    select: { id: true, name: true }
  })
  console.log(`Found ${conductors.length} conductors\n`)

  // Create a map of conductor names to their IDs (case-insensitive)
  const conductorMap = new Map<string, string>()
  for (const conductor of conductors) {
    conductorMap.set(conductor.name.toLowerCase().trim(), conductor.id)
  }

  let linked = 0
  let created = 0
  let skipped = 0
  const errors: string[] = []

  // Process first 22 buses (matching the Excel data)
  const busesToProcess = buses.slice(0, 22)

  for (let i = 0; i < busesToProcess.length; i++) {
    const bus = busesToProcess[i]
    const busNumber = i + 1
    const conductorName = conductorsByBusOrder[i]

    if (!conductorName) {
      errors.push(`No conductor defined for bus #${busNumber} (${bus.registrationNumber})`)
      continue
    }

    const conductorId = conductorMap.get(conductorName.toLowerCase().trim())
    if (!conductorId) {
      errors.push(`Conductor not found in database: ${conductorName}`)
      continue
    }

    // Check if there's already a BusRoute for this bus
    const existingRoutes = await prisma.busRoute.findMany({
      where: { busId: bus.id }
    })

    if (existingRoutes.length > 0) {
      // Update all existing routes with conductor
      for (const route of existingRoutes) {
        await prisma.busRoute.update({
          where: { id: route.id },
          data: { conductorId: conductorId }
        })
      }
      console.log(`✓ Bus #${busNumber} (${bus.registrationNumber}) -> ${conductorName}`)
      linked++
    } else {
      // No route exists - create one with required fields
      const busWithDriver = await prisma.bus.findUnique({
        where: { id: bus.id },
        include: { primaryDriver: true }
      })

      // Get a default route
      const defaultRoute = await prisma.route.findFirst()

      if (defaultRoute && busWithDriver?.primaryDriverId) {
        await prisma.busRoute.create({
          data: {
            busId: bus.id,
            driverId: busWithDriver.primaryDriverId,
            conductorId: conductorId,
            routeId: defaultRoute.id,
            academicTerm: '2024-25',
            startDate: new Date(),
          }
        })
        console.log(`✓ Bus #${busNumber} (${bus.registrationNumber}) -> ${conductorName} [new route]`)
        created++
      } else if (defaultRoute) {
        // Create route without driver
        await prisma.busRoute.create({
          data: {
            busId: bus.id,
            conductorId: conductorId,
            routeId: defaultRoute.id,
            academicTerm: '2024-25',
            startDate: new Date(),
          }
        })
        console.log(`✓ Bus #${busNumber} (${bus.registrationNumber}) -> ${conductorName} [new route, no driver]`)
        created++
      } else {
        errors.push(`Bus #${busNumber} (${bus.registrationNumber}): No route available to create assignment`)
      }
    }
  }

  // Note remaining buses without conductors
  if (buses.length > 22) {
    console.log(`\nNote: ${buses.length - 22} additional buses exist without conductor assignments`)
    for (let i = 22; i < buses.length; i++) {
      console.log(`  - Bus #${i + 1}: ${buses[i].registrationNumber}`)
    }
  }

  console.log('\n=== SUMMARY ===')
  console.log(`Updated existing routes: ${linked}`)
  console.log(`Created new routes: ${created}`)

  if (errors.length > 0) {
    console.log('\n=== ISSUES ===')
    errors.forEach(e => console.log(`- ${e}`))
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
