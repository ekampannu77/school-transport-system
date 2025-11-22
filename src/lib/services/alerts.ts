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

  return drivers.map((driver) => {
    const daysRemaining = Math.ceil(
      (driver.licenseExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      id: driver.id,
      type: 'driver_license' as const,
      severity: daysRemaining <= 7 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'info',
      message: `Driver ${driver.name}'s license expires in ${daysRemaining} days`,
      dueDate: driver.licenseExpiry,
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
      Permit: 'permit',
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
 * Get all critical alerts (combined driver and bus alerts)
 */
export async function getAllCriticalAlerts(daysThreshold: number = 30): Promise<{
  alerts: ExpiryAlert[]
  criticalCount: number
  warningCount: number
  infoCount: number
}> {
  const [driverAlerts, busAlerts] = await Promise.all([
    checkDriverLicenseExpiries(daysThreshold),
    checkBusReminders(daysThreshold),
  ])

  const allAlerts = [...driverAlerts, ...busAlerts].sort(
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
