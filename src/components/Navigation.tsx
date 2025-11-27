'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Bus, DollarSign, AlertTriangle, Home, User, MapPin, FileText, Wallet, Users, Fuel } from 'lucide-react'
import ExportModal from './ExportModal'

export default function Navigation() {
  const pathname = usePathname()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const links = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/fleet', label: 'Fleet', icon: Bus },
    { href: '/drivers', label: 'Drivers', icon: User },
    { href: '/routes', label: 'Routes', icon: MapPin },
    { href: '/fees', label: 'Fees', icon: Wallet },
    { href: '/private-buses', label: 'Private Buses', icon: Users },
    { href: '/fuel-inventory', label: 'Fuel', icon: Fuel },
    { href: '/expenses', label: 'Expenses', icon: DollarSign },
    { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/asm-logo.png"
                alt="ASM Public School Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
              <div className="ml-3">
                <div className="text-lg font-bold text-gray-900 leading-tight">
                  ASM Public School
                </div>
                <div className="text-xs text-gray-600">
                  Transport Management
                </div>
              </div>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors border border-primary-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {link.label}
              </Link>
            )
          })}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="w-full flex items-center px-3 py-2 text-base font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md border-t border-gray-200 mt-2 pt-2"
          >
            <FileText className="h-5 w-5 mr-3" />
            Export Report
          </button>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </nav>
  )
}
