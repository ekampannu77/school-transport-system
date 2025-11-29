import { prisma } from '@/lib/prisma'
import { ReminderStatus } from '@prisma/client'

export interface ExpiryAlert {
  id: string
  type: 'driver_license' | 'bus_insurance' | 'bus_permit' | 'other'
  severity: 'critical' | 'warning' | 'info'
  message: string
  dueDate: Date
  daysRemaining: number
  entityId: string
  entityName: string
}

/**
 * Check for driver license expiries within the specified number of days
 */
export async function checkDriverLicenseExpiries(daysThreshold: number = 30): Promise<ExpiryAlert[]> {
  const today = new Date()
  const thresholdDate = new Date()
  thresholdDate.setDate(today.getDate() + daysThreshold)

  const drivers = await prisma.driver.findMany({
    where: {
      status: 'active',
      licenseExpiry: {
        lte: thresholdDate,
        gte: today,
      },
    },
  })

  return drivers
    .filter((driver) => driver.licenseExpiry !== null)
    .map((driver) => {
      const licenseExpiry = driver.licenseExpiry as Date
      const daysRemaining = Math.ceil(
        (licenseExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: driver.id,
        type: 'driver_license' as const,
        severity: daysRemaining <= 7 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'info',
        message: `Driver ${driver.name}'s license expires in ${daysRemaining} days`,
        dueDate: licenseExpiry,
        daysRemaining,
        entityId: driver.id,
        entityName: driver.name,
      }
    })
}

/**
 * Check for bus-related expiries (insurance, permits, etc.)
 */
export async function checkBusReminders(daysThreshold: number = 30): Promise<ExpiryAlert[]> {
  const today = new Date()
  const thresholdDate = new Date()
  thresholdDate.setDate(today.getDate() + daysThreshold)

  const reminders = await prisma.reminder.findMany({
    where: {
      status: ReminderStatus.Pending,
      dueDate: {
        lte: thresholdDate,
        gte: today,
      },
    },
    include: {
      bus: true,
    },
  })

  return reminders.map((reminder) => {
    const daysRemaining = Math.ceil(
      (reminder.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    const typeMap: Record<string, string> = {
      Insurance_Renewal: 'insurance',
      Permit: 'registration',
      Oil_Change: 'maintenance',
      License_Renewal: 'license',
      Fitness_Certificate: 'fitness',
      Pollution_Certificate: 'pollution',
    }

    return {
      id: reminder.id,
      type: (typeMap[reminder.type] || 'other') as any,
      severity: daysRemaining <= 7 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'info',
      message: `${reminder.type.replace(/_/g, ' ')} for bus ${reminder.bus.registrationNumber} due in ${daysRemaining} days`,
      dueDate: reminder.dueDate,
      daysRemaining,
      entityId: reminder.bus.id,
      entityName: reminder.bus.registrationNumber,
    }
  })
}

/**
 * Check for bus document expiries directly from bus records
 * This catches expiries even if reminders weren't created
 */
export async function checkBusDocumentExpiries(daysThreshold: number = 30): Promise<ExpiryAlert[]> {
  const today = new Date()
  const thresholdDate = new Date()
  thresholdDate.setDate(today.getDate() + daysThreshold)

  const buses = await prisma.bus.findMany({
    where: {
      OR: [
        {
          fitnessExpiry: {
            lte: thresholdDate,
            gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // Include expired up to 30 days ago
          },
        },
        {
          registrationExpiry: {
            lte: thresholdDate,
            gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        {
          insuranceExpiry: {
            lte: thresholdDate,
            gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  })

  const alerts: ExpiryAlert[] = []

  for (const bus of buses) {
    // Check fitness expiry
    if (bus.fitnessExpiry) {
      const daysRemaining = Math.ceil(
        (bus.fitnessExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysRemaining <= daysThreshold) {
        alerts.push({
          id: `fitness-${bus.id}`,
          type: 'other',
          severity: daysRemaining < 0 ? 'critical' : daysRemaining <= 7 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'info',
          message: daysRemaining < 0
            ? `Fitness Certificate for bus ${bus.registrationNumber} expired ${Math.abs(daysRemaining)} days ago`
            : `Fitness Certificate for bus ${bus.registrationNumber} expires in ${daysRemaining} days`,
          dueDate: bus.fitnessExpiry,
          daysRemaining,
          entityId: bus.id,
          entityName: bus.registrationNumber,
        })
      }
    }

    // Check registration expiry
    if (bus.registrationExpiry) {
      const daysRemaining = Math.ceil(
        (bus.registrationExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysRemaining <= daysThreshold) {
        alerts.push({
          id: `registration-${bus.id}`,
          type: 'bus_permit',
          severity: daysRemaining < 0 ? 'critical' : daysRemaining <= 7 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'info',
          message: daysRemaining < 0
            ? `Registration for bus ${bus.registrationNumber} expired ${Math.abs(daysRemaining)} days ago`
            : `Registration for bus ${bus.registrationNumber} expires in ${daysRemaining} days`,
          dueDate: bus.registrationExpiry,
          daysRemaining,
          entityId: bus.id,
          entityName: bus.registrationNumber,
        })
      }
    }

    // Check insurance expiry
    if (bus.insuranceExpiry) {
      const daysRemaining = Math.ceil(
        (bus.insuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysRemaining <= daysThreshold) {
        alerts.push({
          id: `insurance-${bus.id}`,
          type: 'bus_insurance',
          severity: daysRemaining < 0 ? 'critical' : daysRemaining <= 7 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'info',
          message: daysRemaining < 0
            ? `Insurance for bus ${bus.registrationNumber} expired ${Math.abs(daysRemaining)} days ago`
            : `Insurance for bus ${bus.registrationNumber} expires in ${daysRemaining} days`,
          dueDate: bus.insuranceExpiry,
          daysRemaining,
          entityId: bus.id,
          entityName: bus.registrationNumber,
        })
      }
    }
  }

  return alerts
}

/**
 * Get all critical alerts (combined driver and bus alerts)
 */
export async function getAllCriticalAlerts(daysThreshold: number = 30): Promise<{
  alerts: ExpiryAlert[]
  criticalCount: number
  warningCount: number
  infoCount: number
}> {
  const [driverAlerts, busAlerts, documentExpiryAlerts] = await Promise.all([
    checkDriverLicenseExpiries(daysThreshold),
    checkBusReminders(daysThreshold),
    checkBusDocumentExpiries(daysThreshold),
  ])

  // Combine and deduplicate alerts (prefer document expiry alerts as they're more direct)
  const alertMap = new Map<string, ExpiryAlert>()

  // Add reminder-based alerts first
  for (const alert of busAlerts) {
    alertMap.set(alert.id, alert)
  }

  // Add document expiry alerts (these will have unique IDs like fitness-xxx, registration-xxx)
  for (const alert of documentExpiryAlerts) {
    alertMap.set(alert.id, alert)
  }

  // Add driver alerts
  for (const alert of driverAlerts) {
    alertMap.set(alert.id, alert)
  }

  const allAlerts = Array.from(alertMap.values()).sort(
    (a, b) => a.daysRemaining - b.daysRemaining
  )

  const criticalCount = allAlerts.filter((a) => a.severity === 'critical').length
  const warningCount = allAlerts.filter((a) => a.severity === 'warning').length
  const infoCount = allAlerts.filter((a) => a.severity === 'info').length

  return {
    alerts: allAlerts,
    criticalCount,
    warningCount,
    infoCount,
  }
}

/**
 * Mark a reminder as resolved
 */
export async function resolveReminder(reminderId: string) {
  return await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: ReminderStatus.Resolved },
  })
}
