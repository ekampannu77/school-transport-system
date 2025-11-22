import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { documentType, documentName, fileUrl, expiryDate, notes } = body

    if (!documentType || !documentName || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: documentType, documentName, fileUrl' },
        { status: 400 }
      )
    }

    const document = await prisma.driverDocument.create({
      data: {
        driverId: params.id,
        documentType,
        documentName,
        fileUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documents = await prisma.driverDocument.findMany({
      where: { driverId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
