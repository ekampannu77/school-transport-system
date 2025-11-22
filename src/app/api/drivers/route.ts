import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DriverStatus } from '@prisma/client'

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        busRoutes: {
          include: {
            bus: {
              select: {
                registrationNumber: true,
              },
            },
            route: {
              select: {
                routeName: true,
              },
            },
          },
        },
        _count: {
          select: {
            busRoutes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(drivers)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, licenseNumber, phone, address, licenseExpiry, status } = body

    // Validation
    if (!name || !licenseNumber || !phone || !licenseExpiry) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    if (status && !Object.values(DriverStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid driver status' },
        { status: 400 }
      )
    }

    // Create new driver
    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        phone,
        address: address || null,
        licenseExpiry: new Date(licenseExpiry),
        status: status || DriverStatus.active,
      },
    })

    return NextResponse.json(driver, { status: 201 })
  } catch (error: any) {
    console.error('Error creating driver:', error)

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Driver with this license number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, licenseNumber, phone, address, licenseExpiry, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Update driver
    const driver = await prisma.driver.update({
      where: { id },
      data: {
        name,
        licenseNumber,
        phone,
        address: address || null,
        licenseExpiry: new Date(licenseExpiry),
        status,
      },
    })

    return NextResponse.json(driver)
  } catch (error: any) {
    console.error('Error updating driver:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Driver with this license number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update driver' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    await prisma.driver.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Driver deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting driver:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete driver' },
      { status: 500 }
    )
  }
}
