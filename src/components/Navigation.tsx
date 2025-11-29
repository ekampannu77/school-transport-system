'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Bus, DollarSign, Home, User, FileText, Wallet, Users, Fuel, ChevronDown, Car } from 'lucide-react'
import ExportModal from './ExportModal'

interface DropdownItem {
  href: string
  label: string
  icon: React.ElementType
}

interface NavItem {
  label: string
  icon: React.ElementType
  href?: string
  items?: DropdownItem[]
}

function DropdownMenu({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const Icon = item.icon

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'text-primary-700 bg-primary-50'
            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
        }`}
      >
        <Icon className="h-4 w-4 mr-2" />
        {item.label}
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && item.items && (
        <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {item.items.map((subItem) => {
            const SubIcon = subItem.icon
            const isSubActive = pathname === subItem.href
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                  isSubActive
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <SubIcon className="h-4 w-4 mr-3" />
                {subItem.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/'
    },
    {
      label: 'Fleet',
      icon: Bus,
      items: [
        { href: '/fleet', label: 'Buses', icon: Bus },
        { href: '/drivers', label: 'Drivers', icon: User },
      ]
    },
    {
      label: 'Fuel',
      icon: Fuel,
      href: '/fuel-inventory'
    },
    {
      label: 'Personal Vehicles',
      icon: Car,
      href: '/personal-vehicles'
    },
    {
      label: 'Private Buses',
      icon: Users,
      href: '/private-buses'
    },
    {
      label: 'Fees',
      icon: Wallet,
      href: '/fees'
    },
    {
      label: 'Expenses',
      icon: DollarSign,
      href: '/expenses'
    },
  ]

  // Check if any item in a dropdown is active
  const isDropdownActive = (items: DropdownItem[] | undefined) => {
    if (!items) return false
    return items.some(item => pathname === item.href)
  }

  // All links for mobile menu
  const allLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/fleet', label: 'Buses', icon: Bus },
    { href: '/drivers', label: 'Drivers', icon: User },
    { href: '/fees', label: 'Fees', icon: Wallet },
    { href: '/private-buses', label: 'Private Buses', icon: Users },
    { href: '/expenses', label: 'Expenses', icon: DollarSign },
    { href: '/fuel-inventory', label: 'Fuel', icon: Fuel },
    { href: '/personal-vehicles', label: 'Personal Vehicles', icon: Car },
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
            <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-2">
              {navItems.map((item) => {
                if (item.href) {
                  // Single link (Dashboard, Alerts)
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'text-primary-700 bg-primary-50'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  )
                } else {
                  // Dropdown menu (Fleet, Finance)
                  return (
                    <DropdownMenu
                      key={item.label}
                      item={item}
                      isActive={isDropdownActive(item.items)}
                    />
                  )
                }
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

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {allLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
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
              onClick={() => {
                setIsMobileMenuOpen(false)
                setIsExportModalOpen(true)
              }}
              className="w-full flex items-center px-3 py-2 text-base font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md border-t border-gray-200 mt-2 pt-2"
            >
              <FileText className="h-5 w-5 mr-3" />
              Export Report
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </nav>
  )
}
