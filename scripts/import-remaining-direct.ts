import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'

const prisma = new PrismaClient()

const EXCEL_FILE = '/Users/ekampannu7/Desktop/Convenc Fee 2025-26.xls'
const SHEET_NAME = 'Satnam S'
const BUS_ID = 'cmidgrmgt000djcdelunrp6pt'

// Roman numeral conversion
const ROMAN_TO_NUM: Record<string, string> = {
  'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
  'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
  'XI': '11', 'XII': '12'
}

function convertClass(classStr: string): string {
  if (!classStr || classStr === 'nan') return 'Unknown'

  const str = classStr.trim()

  if (str.toUpperCase().includes('UKG')) return 'UKG'
  if (str.toUpperCase().includes('LKG')) return 'LKG'

  for (const [roman, num] of Object.entries(ROMAN_TO_NUM)) {
    if (str.startsWith(roman + ' ')) {
      return str.replace(roman + ' ', `Class ${num}-`)
    }
  }

  return str
}

async function main() {
  console.log('📚 Reading Excel file...')
  const workbook = xlsx.readFile(EXCEL_FILE)
  const sheet = workbook.Sheets[SHEET_NAME]
  const data: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 })

  // Get existing students
  const existingStudents = await prisma.student.findMany({
    where: { busId: BUS_ID },
    select: { name: true }
  })
  const existingNames = new Set(existingStudents.map(s => s.name))

  console.log(`\n📊 Found ${existingNames.size} existing students`)
  console.log('\n🚌 Importing remaining students directly via Prisma...')
  console.log('='.repeat(70))

  let imported = 0
  let skipped = 0

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 2) continue

    const name = String(row[1] || '').trim()
    const classRaw = String(row[2] || '').trim()
    const village = String(row[3] || '').trim()
    const fee = parseFloat(String(row[4] || '1500').replace(/[^0-9.]/g, ''))

    if (!name || name === 'nan' || name.toLowerCase().includes('total')) continue

    // Skip if already exists
    if (existingNames.has(name)) {
      skipped++
      continue
    }

    const studentClass = convertClass(classRaw)

    try {
      await prisma.student.create({
        data: {
          name,
          class: studentClass,
          village: village || 'Unknown',
          monthlyFee: fee || 1500,
          parentName: 'Parent',  // Default
          parentContact: '0000000000',  // Default
          busId: BUS_ID,
        }
      })

      imported++
      console.log(`✅ ${String(imported).padStart(2, ' ')}. ${name.padEnd(30, ' ')} | ${studentClass.padEnd(12, ' ')} | ${village.padEnd(10, ' ')} | ₹${fee}`)
    } catch (error: any) {
      console.log(`❌ ${name}: ${error.message}`)
    }
  }

  console.log('='.repeat(70))
  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported} new students`)
  console.log(`   ⏭️  Skipped (already exist): ${skipped} students`)

  const totalStudents = await prisma.student.count({ where: { busId: BUS_ID } })
  console.log(`\n✅ Total students for this bus: ${totalStudents}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
