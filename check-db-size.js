const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabaseSize() {
  try {
    // Get record counts for all tables
    const counts = {
      buses: await prisma.bus.count(),
      drivers: await prisma.driver.count(),
      expenses: await prisma.expense.count(),
      routes: await prisma.route.count(),
      busRoutes: await prisma.busRoute.count(),
      reminders: await prisma.reminder.count(),
      busDocuments: await prisma.busDocument.count(),
      driverDocuments: await prisma.driverDocument.count(),
      users: await prisma.user.count(),
      students: await prisma.student.count(),
    }

    console.log('📊 Database Storage Statistics:')
    console.log('================================\n')

    console.log('📋 Record Counts by Table:')
    console.log('---------------------------')
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`${table.padEnd(20)}: ${count} records`)
    })

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0)
    console.log(`${'TOTAL'.padEnd(20)}: ${totalRecords} records\n`)

    // Get table sizes from PostgreSQL
    const tableSizes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `

    console.log('💾 Table Sizes:')
    console.log('---------------------------')
    let totalBytes = 0
    tableSizes.forEach(table => {
      console.log(`${table.tablename.padEnd(20)}: ${table.size}`)
      totalBytes += Number(table.size_bytes)
    })

    // Get database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) AS size;
    `

    console.log('\n🗄️  Total Database Size:')
    console.log('---------------------------')
    console.log(`Database: ${dbSize[0].size}`)

    // Calculate approximate size in MB
    const sizeInMB = (totalBytes / (1024 * 1024)).toFixed(2)
    console.log(`Tables Total: ${sizeInMB} MB`)

    console.log('\n✅ Database health check complete!')

  } catch (error) {
    console.error('Error checking database size:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseSize()
