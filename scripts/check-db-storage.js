const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabaseStorage() {
  console.log('=' .repeat(70))
  console.log('DATABASE STORAGE ANALYSIS')
  console.log('='.repeat(70))
  console.log()

  try {
    // Get row counts for each table
    const [
      busCount,
      driverCount,
      expenseCount,
      routeCount,
      busRouteCount,
      reminderCount,
      busDocumentCount,
      driverDocumentCount,
      userCount,
      studentCount,
      paymentCount,
    ] = await Promise.all([
      prisma.bus.count(),
      prisma.driver.count(),
      prisma.expense.count(),
      prisma.route.count(),
      prisma.busRoute.count(),
      prisma.reminder.count(),
      prisma.busDocument.count(),
      prisma.driverDocument.count(),
      prisma.user.count(),
      prisma.student.count(),
      prisma.payment.count(),
    ])

    // Get database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `

    // Get table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `

    console.log('TOTAL DATABASE SIZE')
    console.log('-'.repeat(70))
    console.log(`Database: ${dbSize[0].size}`)
    console.log()

    console.log('RECORD COUNTS BY TABLE')
    console.log('-'.repeat(70))
    console.log(`Buses:            ${busCount.toString().padStart(6)}`)
    console.log(`Drivers:          ${driverCount.toString().padStart(6)}`)
    console.log(`Students:         ${studentCount.toString().padStart(6)}`)
    console.log(`Payments:         ${paymentCount.toString().padStart(6)}`)
    console.log(`Expenses:         ${expenseCount.toString().padStart(6)}`)
    console.log(`Routes:           ${routeCount.toString().padStart(6)}`)
    console.log(`Bus Routes:       ${busRouteCount.toString().padStart(6)}`)
    console.log(`Reminders:        ${reminderCount.toString().padStart(6)}`)
    console.log(`Bus Documents:    ${busDocumentCount.toString().padStart(6)}`)
    console.log(`Driver Documents: ${driverDocumentCount.toString().padStart(6)}`)
    console.log(`Users:            ${userCount.toString().padStart(6)}`)
    console.log()

    const totalRecords =
      busCount + driverCount + studentCount + paymentCount +
      expenseCount + routeCount + busRouteCount + reminderCount +
      busDocumentCount + driverDocumentCount + userCount

    console.log(`TOTAL RECORDS:    ${totalRecords.toString().padStart(6)}`)
    console.log()

    console.log('TABLE SIZES (Including Indexes)')
    console.log('-'.repeat(70))
    tableSizes.forEach(table => {
      console.log(`${table.tablename.padEnd(25)} ${table.size}`)
    })
    console.log()

    console.log('='.repeat(70))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseStorage()
