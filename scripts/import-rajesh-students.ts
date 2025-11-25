import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'

const prisma = new PrismaClient()

const EXCEL_FILE = '/Users/ekampannu7/Desktop/Convenc Fee 2025-26.xls'
const SHEET_NAME = 'Rajesh'
const BUS_ID = 'cmidgrns1000rjcdest3gqkqn'

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

  // Convert "XII COM" → "12", "IV A" → "4", "X A" → "10", etc.
  for (const [roman, num] of Object.entries(ROMAN_TO_NUM)) {
    if (str.startsWith(roman + ' ')) {
      return num
    }
  }

  return str
}

async function main() {
  console.log('🚌 Importing Rajesh students from Excel...')
  console.log('='.repeat(70))

  // Step 1: Increase bus capacity
  console.log('\n🔧 Step 1: Increasing bus capacity to 45 seats')
  await prisma.bus.update({
    where: { id: BUS_ID },
    data: { seatingCapacity: 45 },
  })
  console.log('✅ Bus capacity updated to 45 seats')

  // Step 2: Read Excel
  console.log('\n📚 Step 2: Reading Excel file...')
  const workbook = xlsx.readFile(EXCEL_FILE)
  const sheet = workbook.Sheets[SHEET_NAME]
  const data: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 })

  console.log('\n🔄 Step 3: Importing students...')
  console.log('='.repeat(70))

  let imported = 0
  let skipped = 0

  for (let i = 2; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 2) continue

    const name = String(row[1] || '').trim()
    const classRaw = String(row[2] || '').trim()
    const village = String(row[3] || '').trim()
    const fee = parseFloat(String(row[4] || '1000').replace(/[^0-9.]/g, ''))

    if (!name || name === 'nan' || name.toLowerCase().includes('total')) continue

    // Check if already exists
    const existing = await prisma.student.findFirst({
      where: {
        name: name,
        busId: BUS_ID
      }
    })

    if (existing) {
      console.log(`⏭️  ${name} - already exists`)
      skipped++
      continue
    }

    const studentClass = convertClass(classRaw)

    try {
      await prisma.student.create({
        data: {
          name,
          class: studentClass,
          village: village || 'Padampur',
          monthlyFee: fee || 1000,
          parentName: 'Parent',
          parentContact: '0000000000',
          busId: BUS_ID,
        }
      })

      imported++
      console.log(`✅ ${String(imported).padStart(2, ' ')}. ${name.padEnd(30, ' ')} | ${studentClass.padEnd(12, ' ')} | ${village.padEnd(12, ' ')} | ₹${fee}`)
    } catch (error: any) {
      console.log(`❌ ${name}: ${error.message}`)
    }
  }

  console.log('='.repeat(70))
  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported} new students`)
  console.log(`   ⏭️  Skipped: ${skipped} students`)

  const totalStudents = await prisma.student.count({ where: { busId: BUS_ID } })
  console.log(`\n✅ Total students for bus RJ 13 PA 4654: ${totalStudents}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
