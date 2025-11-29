import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DriverStatus } from '@prisma/client'
import { createDriverSchema, updateDriverSchema, validateRequest } from '@/lib/validations'
import { driverLogger } from '@/lib/logger'

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
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
    driverLogger.debug('Fetched all drivers', { count: drivers.length })
    return NextResponse.json(drivers)
  } catch (error) {
    driverLogger.error('Error fetching drivers', error)
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(createDriverSchema, body)
    if (!validation.success) {
      driverLogger.info('Driver creation validation failed', { error: validation.error })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { name, role, licenseNumber, phone, address, licenseExpiry, aadharNumber, status } = validation.data

    // Create new driver
    const driver = await prisma.driver.create({
      data: {
        name,
        role: role || 'driver',
        licenseNumber: licenseNumber || null,
        phone,
        address: address || null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        aadharNumber: aadharNumber || null,
        status: status || DriverStatus.active,
      },
    })

    driverLogger.info('Driver created successfully', { driverId: driver.id, name })

    return NextResponse.json(driver, { status: 201 })
  } catch (error: any) {
    driverLogger.error('Error creating driver', error, { code: error.code })

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field'
      return NextResponse.json(
        { error: `Driver with this ${field} already exists` },
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

    // Validate input
    const validation = validateRequest(updateDriverSchema, body)
    if (!validation.success) {
      driverLogger.info('Driver update validation failed', { error: validation.error })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { id, name, role, licenseNumber, phone, address, licenseExpiry, aadharNumber, status } = validation.data

    // Update driver
    const driver = await prisma.driver.update({
      where: { id },
      data: {
        name,
        role,
        licenseNumber: licenseNumber || null,
        phone,
        address: address || null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        aadharNumber: aadharNumber || null,
        status,
      },
    })

    driverLogger.info('Driver updated successfully', { driverId: id, name })

    return NextResponse.json(driver)
  } catch (error: any) {
    driverLogger.error('Error updating driver', error, { code: error.code })

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

    driverLogger.info('Driver deleted successfully', { driverId: id })

    return NextResponse.json({ message: 'Driver deleted successfully' })
  } catch (error: any) {
    driverLogger.error('Error deleting driver', error, { code: error.code })

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
