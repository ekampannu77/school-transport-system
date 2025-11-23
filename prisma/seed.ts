import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.expense.deleteMany()
  await prisma.busRoute.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.bus.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.route.deleteMany()

  // Create Drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'Rajesh Kumar',
        role: 'driver',
        licenseNumber: 'DL-0420230012345',
        licenseExpiry: new Date('2026-03-15'),
        phone: '+91-9876543210',
        address: '123 Model Town, Delhi',
        status: 'active',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Amit Singh',
        role: 'driver',
        licenseNumber: 'DL-0420230067890',
        licenseExpiry: new Date('2025-12-20'),
        phone: '+91-9876543211',
        address: '456 Laxmi Nagar, Delhi',
        status: 'active',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Suresh Sharma',
        role: 'driver',
        licenseNumber: 'DL-0420230098765',
        licenseExpiry: new Date('2025-11-30'),
        phone: '+91-9876543212',
        address: '789 Saket, Delhi',
        status: 'active',
      },
    }),
  ])

  console.log(`✅ Created ${drivers.length} drivers`)

  // Create Conductors
  const conductors = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'Ramesh Gupta',
        role: 'conductor',
        phone: '+91-9876543213',
        address: '321 Rohini, Delhi',
        status: 'active',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Vijay Verma',
        role: 'conductor',
        phone: '+91-9876543214',
        address: '654 Dwarka, Delhi',
        status: 'active',
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Manoj Yadav',
        role: 'conductor',
        phone: '+91-9876543215',
        address: '987 Janakpuri, Delhi',
        status: 'active',
      },
    }),
  ])

  console.log(`✅ Created ${conductors.length} conductors`)

  // Create Buses
  const buses = await Promise.all([
    prisma.bus.create({
      data: {
        registrationNumber: 'DL-01-AB-1234',
        chassisNumber: 'CH123456789',
        seatingCapacity: 40,
        purchaseDate: new Date('2020-01-15'),
        primaryDriverId: drivers[0].id,
      },
    }),
    prisma.bus.create({
      data: {
        registrationNumber: 'DL-01-CD-5678',
        chassisNumber: 'CH987654321',
        seatingCapacity: 35,
        purchaseDate: new Date('2021-06-20'),
        primaryDriverId: drivers[1].id,
      },
    }),
    prisma.bus.create({
      data: {
        registrationNumber: 'DL-01-EF-9012',
        chassisNumber: 'CH456789123',
        seatingCapacity: 50,
        purchaseDate: new Date('2019-03-10'),
        primaryDriverId: drivers[2].id,
      },
    }),
  ])

  console.log(`✅ Created ${buses.length} buses`)

  // Create Routes
  const routes = await Promise.all([
    prisma.route.create({
      data: {
        routeName: 'North Delhi Circuit',
        startPoint: 'Model Town',
        endPoint: 'School Campus',
        totalDistanceKm: 15.5,
      },
    }),
    prisma.route.create({
      data: {
        routeName: 'South Delhi Circuit',
        startPoint: 'Greater Kailash',
        endPoint: 'School Campus',
        totalDistanceKm: 12.3,
      },
    }),
    prisma.route.create({
      data: {
        routeName: 'East Delhi Circuit',
        startPoint: 'Laxmi Nagar',
        endPoint: 'School Campus',
        totalDistanceKm: 18.7,
      },
    }),
  ])

  console.log(`✅ Created ${routes.length} routes`)

  // Create Bus Routes (Assignments)
  const busRoutes = await Promise.all([
    prisma.busRoute.create({
      data: {
        busId: buses[0].id,
        conductorId: conductors[0].id,
        routeId: routes[0].id,
        academicTerm: '2024-2025',
        startDate: new Date('2024-04-01'),
      },
    }),
    prisma.busRoute.create({
      data: {
        busId: buses[1].id,
        conductorId: conductors[1].id,
        routeId: routes[1].id,
        academicTerm: '2024-2025',
        startDate: new Date('2024-04-01'),
      },
    }),
    prisma.busRoute.create({
      data: {
        busId: buses[2].id,
        conductorId: conductors[2].id,
        routeId: routes[2].id,
        academicTerm: '2024-2025',
        startDate: new Date('2024-04-01'),
      },
    }),
  ])

  console.log(`✅ Created ${busRoutes.length} bus-route assignments`)

  // Create Expenses (varied examples)
  const today = new Date()
  const expenses = await Promise.all([
    // Fuel expenses
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: 'Fuel',
        amount: 4500,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        description: 'Diesel fill-up',
        odometerReading: 45000,
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: 'Fuel',
        amount: 4800,
        date: new Date(today.getFullYear(), today.getMonth(), 15),
        description: 'Diesel fill-up',
        odometerReading: 45350,
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[1].id,
        category: 'Fuel',
        amount: 3900,
        date: new Date(today.getFullYear(), today.getMonth(), 5),
        description: 'Diesel fill-up',
        odometerReading: 32000,
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[2].id,
        category: 'Fuel',
        amount: 5200,
        date: new Date(today.getFullYear(), today.getMonth(), 7),
        description: 'Diesel fill-up',
        odometerReading: 52000,
      },
    }),
    // Maintenance expenses
    prisma.expense.create({
      data: {
        busId: buses[2].id,
        category: 'Maintenance',
        amount: 15000,
        date: new Date(today.getFullYear(), today.getMonth(), 10),
        description: 'Engine overhaul and brake pad replacement',
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: 'Maintenance',
        amount: 2500,
        date: new Date(today.getFullYear(), today.getMonth(), 8),
        description: 'Oil change and filter replacement',
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[1].id,
        category: 'Maintenance',
        amount: 3200,
        date: new Date(today.getFullYear(), today.getMonth(), 12),
        description: 'Tire replacement',
      },
    }),
    // Salary
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: 'Salary',
        amount: 25000,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        description: 'Driver salary - Rajesh Kumar',
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[1].id,
        category: 'Salary',
        amount: 25000,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        description: 'Driver salary - Amit Singh',
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[2].id,
        category: 'Salary',
        amount: 25000,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        description: 'Driver salary - Suresh Sharma',
      },
    }),
    // Insurance
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: 'Insurance',
        amount: 35000,
        date: new Date(today.getFullYear(), today.getMonth(), 2),
        description: 'Annual comprehensive insurance premium',
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[1].id,
        category: 'Insurance',
        amount: 32000,
        date: new Date(today.getFullYear(), today.getMonth(), 3),
        description: 'Annual comprehensive insurance premium',
      },
    }),
    // Other (Repair)
    prisma.expense.create({
      data: {
        busId: buses[1].id,
        category: 'Other',
        amount: 8500,
        date: new Date(today.getFullYear(), today.getMonth(), 18),
        description: 'AC repair and compressor replacement',
      },
    }),
  ])

  console.log(`✅ Created ${expenses.length} expense records`)

  console.log('✅ Database seed completed successfully!')
  console.log(`
📊 Summary:
- ${drivers.length} drivers
- ${conductors.length} conductors
- ${buses.length} buses
- ${routes.length} routes
- ${busRoutes.length} bus-route assignments
- ${expenses.length} expenses

You can now test the export function with data from ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
