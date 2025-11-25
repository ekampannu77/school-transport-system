import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BUS_ID = 'cmidgrmgt000djcdelunrp6pt'

function simplifyClass(classStr: string): string {
  if (!classStr) return 'Unknown'

  // Keep LKG and UKG as is
  if (classStr.toUpperCase().includes('LKG')) return 'LKG'
  if (classStr.toUpperCase().includes('UKG')) return 'UKG'

  // Extract number from "Class 6-A", "Class 12-Sci", etc.
  // Match patterns like "Class 6-A" or "Class 12-S" or "Class 12- S"
  const match = classStr.match(/Class\s+(\d+)/)
  if (match) {
    return match[1]
  }

  // If already just a number
  if (/^\d+$/.test(classStr.trim())) {
    return classStr.trim()
  }

  return classStr
}

async function main() {
  console.log('🔄 Simplifying class names for all students...')
  console.log('='.repeat(70))

  const students = await prisma.student.findMany({
    where: { busId: BUS_ID },
    orderBy: { name: 'asc' }
  })

  console.log(`Found ${students.length} students to update\n`)

  let updated = 0
  let unchanged = 0

  for (const student of students) {
    const oldClass = student.class
    const newClass = simplifyClass(oldClass)

    if (oldClass !== newClass) {
      await prisma.student.update({
        where: { id: student.id },
        data: { class: newClass }
      })
      console.log(`✅ ${student.name.padEnd(30)} | ${oldClass.padEnd(15)} → ${newClass}`)
      updated++
    } else {
      unchanged++
    }
  }

  console.log('='.repeat(70))
  console.log(`\n📊 Update Summary:`)
  console.log(`   ✅ Updated: ${updated} students`)
  console.log(`   ⏭️  Unchanged: ${unchanged} students`)
  console.log(`\n✅ All classes simplified!`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
