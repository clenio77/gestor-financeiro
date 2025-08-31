'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useIsMobile, useIsTouchDevice } from '@/hooks/useDevice'
import { useTheme } from './ThemeProvider'

interface NavigationItem {
  href: string
  label: string
  icon: string
  badge?: number
}

const navigationItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transactions', label: 'Transações', icon: '💳' },
  { href: '/accounts', label: 'Contas', icon: '🏦' },
  { href: '/budgets', label: 'Orçamentos', icon: '📈' },
  { href: '/goals', label: 'Metas', icon: '🎯' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' }
]

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
}

export function MobileNavigation({ isOpen, onClose, onToggle }: MobileNavigationProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const isTouchDevice = useIsTouchDevice()
  const { isDark } = useTheme()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Swipe detection
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && isOpen) {
      onClose()
    }
    if (isRightSwipe && !isOpen) {
      onToggle()
    }
  }

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isOpen && !target.closest('.mobile-drawer') && !target.closest('.mobile-menu-button')) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Close drawer on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  if (!isMobile) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`mobile-drawer fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        } border-r shadow-xl`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">💰</span>
              </div>
              <div>
                <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gestor Financeiro
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Controle suas finanças
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Fechar menu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? isDark
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        : isDark
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>Versão 1.0.0</p>
            <p className="mt-1">© 2024 Gestor Financeiro</p>
          </div>
        </div>
      </div>
    </>
  )
}

// Bottom Navigation for mobile
export function BottomNavigation() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { isDark } = useTheme()

  if (!isMobile) return null

  const mainItems = navigationItems.slice(0, 4) // Show only main 4 items

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 ${
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    } border-t`}>
      <nav className="flex">
        {mainItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                isActive
                  ? isDark
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium truncate">{item.label}</span>
              {item.badge && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </div>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// Mobile Menu Button
interface MobileMenuButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function MobileMenuButton({ onClick, isOpen }: MobileMenuButtonProps) {
  const isMobile = useIsMobile()
  const { isDark } = useTheme()

  if (!isMobile) return null

  return (
    <button
      onClick={onClick}
      className={`mobile-menu-button p-2 rounded-lg transition-all duration-200 ${
        isDark 
          ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
      }`}
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <span
          className={`block w-5 h-0.5 transition-all duration-300 ${
            isDark ? 'bg-gray-300' : 'bg-gray-600'
          } ${
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 mt-1 transition-all duration-300 ${
            isDark ? 'bg-gray-300' : 'bg-gray-600'
          } ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 mt-1 transition-all duration-300 ${
            isDark ? 'bg-gray-300' : 'bg-gray-600'
          } ${
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}
        />
      </div>
    </button>
  )
}
