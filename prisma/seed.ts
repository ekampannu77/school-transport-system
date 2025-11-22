import { PrismaClient, BusStatus, DriverStatus, ExpenseCategory, ReminderType, ReminderStatus } from '@prisma/client'

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

  // Create Buses
  const buses = await Promise.all([
    prisma.bus.create({
      data: {
        registrationNumber: 'DL-01-AB-1234',
        chassisNumber: 'CH123456789',
        seatingCapacity: 40,
        purchaseDate: new Date('2020-01-15'),
        status: BusStatus.active,
      },
    }),
    prisma.bus.create({
      data: {
        registrationNumber: 'DL-01-CD-5678',
        chassisNumber: 'CH987654321',
        seatingCapacity: 35,
        purchaseDate: new Date('2021-06-20'),
        status: BusStatus.active,
      },
    }),
    prisma.bus.create({
      data: {
        registrationNumber: 'DL-01-EF-9012',
        chassisNumber: 'CH456789123',
        seatingCapacity: 50,
        purchaseDate: new Date('2019-03-10'),
        status: BusStatus.maintenance,
      },
    }),
  ])

  console.log(`✅ Created ${buses.length} buses`)

  // Create Drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: 'Rajesh Kumar',
        licenseNumber: 'DL-0420230012345',
        licenseExpiry: new Date('2026-03-15'),
        phone: '+91-9876543210',
        status: DriverStatus.active,
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Amit Singh',
        licenseNumber: 'DL-0420230067890',
        licenseExpiry: new Date('2025-12-20'),
        phone: '+91-9876543211',
        status: DriverStatus.active,
      },
    }),
    prisma.driver.create({
      data: {
        name: 'Suresh Sharma',
        licenseNumber: 'DL-0420230098765',
        licenseExpiry: new Date('2025-11-30'),
        phone: '+91-9876543212',
        status: DriverStatus.active,
      },
    }),
  ])

  console.log(`✅ Created ${drivers.length} drivers`)

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
        driverId: drivers[0].id,
        routeId: routes[0].id,
        academicTerm: '2024-2025',
        startDate: new Date('2024-04-01'),
      },
    }),
    prisma.busRoute.create({
      data: {
        busId: buses[1].id,
        driverId: drivers[1].id,
        routeId: routes[1].id,
        academicTerm: '2024-2025',
        startDate: new Date('2024-04-01'),
      },
    }),
  ])

  console.log(`✅ Created ${busRoutes.length} bus-route assignments`)

  // Create Expenses (varied examples)
  const today = new Date()
  const expenses = await Promise.all([
    // Fuel expenses with odometer readings
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: ExpenseCategory.Fuel,
        amount: 4500,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        description: 'Diesel fill-up',
        odometerReading: 45000,
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: ExpenseCategory.Fuel,
        amount: 4800,
        date: new Date(today.getFullYear(), today.getMonth(), 15),
        description: 'Diesel fill-up',
        odometerReading: 45350,
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[1].id,
        category: ExpenseCategory.Fuel,
        amount: 3900,
        date: new Date(today.getFullYear(), today.getMonth(), 5),
        description: 'Diesel fill-up',
        odometerReading: 32000,
      },
    }),
    // Maintenance expenses
    prisma.expense.create({
      data: {
        busId: buses[2].id,
        category: ExpenseCategory.Maintenance,
        amount: 15000,
        date: new Date(today.getFullYear(), today.getMonth(), 10),
        description: 'Engine overhaul and brake pad replacement',
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: ExpenseCategory.Maintenance,
        amount: 2500,
        date: new Date(today.getFullYear(), today.getMonth(), 8),
        description: 'Oil change and filter replacement',
      },
    }),
    // Salary
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: ExpenseCategory.Salary,
        amount: 25000,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        description: 'Driver salary - Rajesh Kumar',
      },
    }),
    prisma.expense.create({
      data: {
        busId: buses[1].id,
        category: ExpenseCategory.Salary,
        amount: 25000,
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        description: 'Driver salary - Amit Singh',
      },
    }),
    // Insurance
    prisma.expense.create({
      data: {
        busId: buses[0].id,
        category: ExpenseCategory.Insurance,
        amount: 35000,
        date: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        description: 'Annual comprehensive insurance premium',
      },
    }),
  ])

  console.log(`✅ Created ${expenses.length} expense records`)

  // Create Reminders
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const sixtyDaysFromNow = new Date()
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  const fifteenDaysFromNow = new Date()
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15)

  const reminders = await Promise.all([
    prisma.reminder.create({
      data: {
        busId: buses[0].id,
        type: ReminderType.Insurance_Renewal,
        dueDate: thirtyDaysFromNow,
        status: ReminderStatus.Pending,
        notes: 'Comprehensive insurance renewal due',
      },
    }),
    prisma.reminder.create({
      data: {
        busId: buses[1].id,
        type: ReminderType.Permit,
        dueDate: fifteenDaysFromNow,
        status: ReminderStatus.Pending,
        notes: 'Route permit renewal required',
      },
    }),
    prisma.reminder.create({
      data: {
        busId: buses[2].id,
        type: ReminderType.Oil_Change,
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        status: ReminderStatus.Pending,
        notes: 'Scheduled oil change maintenance',
      },
    }),
    prisma.reminder.create({
      data: {
        busId: buses[0].id,
        type: ReminderType.Fitness_Certificate,
        dueDate: sixtyDaysFromNow,
        status: ReminderStatus.Pending,
        notes: 'Annual fitness certificate renewal',
      },
    }),
  ])

  console.log(`✅ Created ${reminders.length} reminders`)
  console.log('✅ Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
