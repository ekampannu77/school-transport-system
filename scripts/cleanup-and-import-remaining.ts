import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const busId = 'cmidgrmgt000djcdelunrp6pt'

  console.log('🔧 Step 1: Increasing bus capacity to 70')
  await prisma.bus.update({
    where: { id: busId },
    data: { seatingCapacity: 70 },
  })
  console.log('✅ Bus capacity updated to 70')

  console.log('\n🧹 Step 2: Finding and removing duplicates')
  const students = await prisma.student.findMany({
    where: { busId },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${students.length} students total`)

  // Group by name to find duplicates
  const studentsByName = new Map<string, any[]>()
  for (const student of students) {
    const existing = studentsByName.get(student.name) || []
    existing.push(student)
    studentsByName.set(student.name, existing)
  }

  // Delete duplicates (keep first occurrence)
  let duplicatesRemoved = 0
  for (const [name, group] of studentsByName) {
    if (group.length > 1) {
      console.log(`Found ${group.length} entries for: ${name}`)
      // Keep the first, delete the rest
      for (let i = 1; i < group.length; i++) {
        await prisma.student.delete({
          where: { id: group[i].id },
        })
        duplicatesRemoved++
      }
    }
  }

  console.log(`✅ Removed ${duplicatesRemoved} duplicate entries`)

  const remainingCount = await prisma.student.count({ where: { busId } })
  console.log(`\n📊 Current unique students: ${remainingCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
