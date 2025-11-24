import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.student.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.busRoute.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.busDocument.deleteMany()
  await prisma.driverDocument.deleteMany()
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

  // Create Students
  const studentData = [
    { name: 'Arjun Sharma', class: '5', village: 'Model Town', parent: 'Vikram Sharma', phone: '+91-9876501001', busId: buses[0].id, fee: 2000 },
    { name: 'Priya Singh', class: '7', village: 'Laxmi Nagar', parent: 'Jaswinder Singh', phone: '+91-9876501002', busId: buses[0].id, fee: 1800 },
    { name: 'Ravi Kumar', class: '10', village: 'Rohini', parent: 'Sunil Kumar', phone: '+91-9876501003', busId: buses[0].id, fee: 2200 },
    { name: 'Simran Kaur', class: '8', village: 'Model Town', parent: 'Gurpreet Kaur', phone: '+91-9876501004', busId: buses[0].id, fee: 1900 },
    { name: 'Aditya Verma', class: '6', village: 'Pitampura', parent: 'Rajesh Verma', phone: '+91-9876501005', busId: buses[0].id, fee: 1750 },
    { name: 'Neha Patel', class: '9', village: 'Model Town', parent: 'Ramesh Patel', phone: '+91-9876501006', busId: buses[0].id, fee: 2100 },
    { name: 'Karan Kapoor', class: '11', village: 'Rohini', parent: 'Anil Kapoor', phone: '+91-9876501007', busId: buses[0].id, fee: 2300 },
    { name: 'Ananya Reddy', class: '5', village: 'Model Town', parent: 'Krishna Reddy', phone: '+91-9876501008', busId: buses[0].id, fee: 2000 },

    { name: 'Rohit Gupta', class: '7', village: 'Greater Kailash', parent: 'Ashok Gupta', phone: '+91-9876501009', busId: buses[1].id, fee: 2500 },
    { name: 'Meera Joshi', class: '10', village: 'Saket', parent: 'Suresh Joshi', phone: '+91-9876501010', busId: buses[1].id, fee: 2600 },
    { name: 'Varun Malhotra', class: '6', village: 'GK II', parent: 'Sandeep Malhotra', phone: '+91-9876501011', busId: buses[1].id, fee: 2400 },
    { name: 'Ishita Bhatia', class: '8', village: 'Greater Kailash', parent: 'Rajiv Bhatia', phone: '+91-9876501012', busId: buses[1].id, fee: 2450 },
    { name: 'Siddharth Gill', class: '9', village: 'Defence Colony', parent: 'Manpreet Gill', phone: '+91-9876501013', busId: buses[1].id, fee: 2550 },
    { name: 'Divya Chopra', class: '12', village: 'Saket', parent: 'Ravi Chopra', phone: '+91-9876501014', busId: buses[1].id, fee: 2700 },
    { name: 'Harsh Sethi', class: '5', village: 'GK I', parent: 'Amit Sethi', phone: '+91-9876501015', busId: buses[1].id, fee: 2400 },

    { name: 'Tanvi Agarwal', class: '7', village: 'Laxmi Nagar', parent: 'Deepak Agarwal', phone: '+91-9876501016', busId: buses[2].id, fee: 1650 },
    { name: 'Arnav Bedi', class: '10', village: 'Preet Vihar', parent: 'Harinder Bedi', phone: '+91-9876501017', busId: buses[2].id, fee: 1800 },
    { name: 'Kavya Dhillon', class: '6', village: 'Mayur Vihar', parent: 'Navdeep Dhillon', phone: '+91-9876501018', busId: buses[2].id, fee: 1700 },
    { name: 'Yash Bhalla', class: '8', village: 'Laxmi Nagar', parent: 'Sanjay Bhalla', phone: '+91-9876501019', busId: buses[2].id, fee: 1750 },
    { name: 'Isha Thakur', class: '11', village: 'Patparganj', parent: 'Rakesh Thakur', phone: '+91-9876501020', busId: buses[2].id, fee: 1900 },
  ]

  const students = []
  for (const data of studentData) {
    const feePaid = Math.floor(Math.random() * data.fee) // Random amount paid
    const student = await prisma.student.create({
      data: {
        name: data.name,
        class: data.class,
        village: data.village,
        parentName: data.parent,
        parentContact: data.phone,
        emergencyContact: data.phone.replace(/\d{4}$/, '9999'),
        monthlyFee: data.fee,
        feePaid: feePaid,
        busId: data.busId,
        startDate: new Date('2024-04-01'),
        isActive: true,
      },
    })
    students.push(student)
  }

  // Add 2 inactive students
  const inactiveStudent1 = await prisma.student.create({
    data: {
      name: 'Rahul Mehta',
      class: '9',
      village: 'Model Town',
      parentName: 'Mohan Mehta',
      parentContact: '+91-9876501021',
      monthlyFee: 2000,
      feePaid: 2000,
      busId: buses[0].id,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-10-15'),
      isActive: false,
    },
  })

  const inactiveStudent2 = await prisma.student.create({
    data: {
      name: 'Anjali Verma',
      class: '7',
      village: 'Greater Kailash',
      parentName: 'Suresh Verma',
      parentContact: '+91-9876501022',
      monthlyFee: 2400,
      feePaid: 2400,
      busId: buses[1].id,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-09-30'),
      isActive: false,
    },
  })

  students.push(inactiveStudent1, inactiveStudent2)

  console.log(`✅ Created ${students.length} students (${students.filter(s => s.isActive).length} active, ${students.filter(s => !s.isActive).length} inactive)`)

  // Create Reminders
  const reminders = await Promise.all([
    prisma.reminder.create({
      data: {
        busId: buses[0].id,
        type: 'Insurance_Renewal',
        dueDate: new Date(today.getFullYear() + 1, 0, 15),
        status: 'Pending',
        notes: 'Insurance renewal for DL-01-AB-1234',
      },
    }),
    prisma.reminder.create({
      data: {
        busId: buses[1].id,
        type: 'Fitness_Certificate',
        dueDate: new Date(today.getFullYear(), today.getMonth() + 2, 20),
        status: 'Pending',
        notes: 'Fitness certificate renewal required',
      },
    }),
    prisma.reminder.create({
      data: {
        busId: buses[2].id,
        type: 'Oil_Change',
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 10),
        status: 'Pending',
        notes: 'Oil change due at 53,000 km',
      },
    }),
    prisma.reminder.create({
      data: {
        busId: buses[0].id,
        type: 'Pollution_Certificate',
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 25),
        status: 'Pending',
        notes: 'PUC renewal required',
      },
    }),
  ])

  console.log(`✅ Created ${reminders.length} reminders`)

  console.log('✅ Database seed completed successfully!')
  console.log(`
📊 Summary:
- ${drivers.length} drivers
- ${conductors.length} conductors
- ${buses.length} buses
- ${routes.length} routes
- ${busRoutes.length} bus-route assignments
- ${students.length} students (${students.filter(s => s.isActive).length} active, ${students.filter(s => !s.isActive).length} inactive)
- ${expenses.length} expenses
- ${reminders.length} reminders

You can now test all features including:
- Fleet management with buses and drivers
- Student management with fee tracking
- Export functionality (both Bus Data and Student Data)
- Expense tracking and reports
- Alerts and reminders

Data is set for ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
