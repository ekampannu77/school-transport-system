import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BUS_ID = 'cmidgrmgt000djcdelunrp6pt'

const remainingStudents = [
  { name: 'Sukhmeet Kaur', class: 'Class 10-A', village: '38 GG II', fee: 1500 },
  { name: 'Manraj Singh Sidhu', class: 'Class 6-M', village: '38 GG II', fee: 1500 },
  { name: 'Bhawanveer Kaur', class: 'Class 10-S', village: '38 GG II', fee: 1500 },
  { name: 'Hemant Singh', class: 'Class 4-M', village: '38 GG', fee: 1500 },
  { name: 'Harjot Singh', class: 'Class 4-M', village: '38 GG', fee: 1500 },
  { name: 'Gurjot Singh', class: 'Class 10-A', village: '6 NN', fee: 1500 },
  { name: 'Harpreet Singh', class: 'Class 6-M', village: '5 NN', fee: 1400 },
  { name: 'Gurkirat Singh', class: 'Class 11-A', village: '5 NN', fee: 1400 },
  { name: 'Najmeen Kaur', class: 'Class 12-S', village: '4 NN', fee: 1400 },
  { name: 'Siya', class: 'UKG', village: '4 NN', fee: 1400 },
  { name: 'Varpreet Kaur', class: 'Class 7-S', village: '4 NN', fee: 1400 },
  { name: 'Sahajdeep Singh', class: 'Class 3-M', village: 'Channa Dham', fee: 1400 },
  { name: 'Aviraj Singh', class: 'Class 12-Sci', village: '4 NN', fee: 1400 },
  { name: 'Navdeep Singh', class: 'Class 10-A', village: '38 GG II', fee: 1500 },
  { name: 'Amritpal Singh', class: 'Class 7-S', village: '4 NN', fee: 1400 },
  { name: 'Jeshman Deep Kaur', class: 'Class 10-S', village: '3 CC', fee: 1300 },
  { name: 'Ekamjeet Singh Sandhu', class: 'Class 6-A', village: '3 CC', fee: 1300 },
  { name: 'Eshman Kaur', class: 'Class 11-A', village: '3 CC', fee: 1300 },
  { name: 'Samreet Kour', class: 'Class 6-M', village: '3 CC', fee: 1300 },
  { name: 'Ajaydeep Singh', class: 'Class 9-A', village: '3 CC', fee: 1300 },
  { name: 'Arjun Singh', class: 'Class 6-A', village: '3 CC', fee: 1300 },
  { name: 'Harman Singh Sandhu', class: 'Class 10-M', village: '3 CC', fee: 1300 },
  { name: 'Gursanj Singh Sumal', class: 'Class 1-A', village: '3 CC', fee: 1300 },
]

async function main() {
  console.log('🚌 Importing remaining students directly via Prisma...')
  console.log('='.repeat(70))

  let imported = 0
  let skipped = 0

  for (const student of remainingStudents) {
    try {
      // Check if already exists
      const existing = await prisma.student.findFirst({
        where: {
          name: student.name,
          busId: BUS_ID
        }
      })

      if (existing) {
        console.log(`⏭️  ${student.name} - already exists`)
        skipped++
        continue
      }

      await prisma.student.create({
        data: {
          name: student.name,
          class: student.class,
          village: student.village,
          monthlyFee: student.fee,
          parentName: 'Parent',
          parentContact: '0000000000',
          busId: BUS_ID,
        }
      })

      imported++
      console.log(`✅ ${String(imported).padStart(2, ' ')}. ${student.name.padEnd(30, ' ')} | ${student.class.padEnd(12, ' ')} | ${student.village.padEnd(12, ' ')} | ₹${student.fee}`)
    } catch (error: any) {
      console.log(`❌ ${student.name}: ${error.message}`)
    }
  }

  console.log('='.repeat(70))
  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported} new students`)
  console.log(`   ⏭️  Skipped: ${skipped} students`)

  const totalStudents = await prisma.student.count({ where: { busId: BUS_ID } })
  console.log(`\n✅ Total students for bus RJ 13 PA 4634: ${totalStudents}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
