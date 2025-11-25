import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const buses = await prisma.bus.findMany({
    include: {
      primaryDriver: true,
      _count: {
        select: { students: true }
      }
    },
    orderBy: { registrationNumber: 'asc' }
  })

  console.log('🎉 FINAL IMPORT RESULTS')
  console.log('='.repeat(70))

  let totalStudents = 0
  buses.forEach((b, i) => {
    const students = b._count.students
    totalStudents += students
    const status = students > 0 ? '✅' : '❌'
    const over = students > b.seatingCapacity ? ` (+${students - b.seatingCapacity} over)` : ''
    console.log(`${status} ${String(i+1).padStart(2)}. ${b.registrationNumber.padEnd(15)} | ${(b.primaryDriver?.name || 'Unknown').padEnd(20)} | ${students}/${b.seatingCapacity}${over}`)
  })

  console.log('='.repeat(70))
  console.log(`\n📊 GRAND TOTAL: ${totalStudents} students imported across ${buses.length} buses`)
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
