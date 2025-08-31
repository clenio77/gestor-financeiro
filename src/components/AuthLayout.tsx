"use client"

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useRequireAuth } from '@/hooks/useAuth'
import { usePWAContext } from '@/components/PWAProvider'
import { MobileNavigation, BottomNavigation, MobileMenuButton } from './MobileNavigation'
import { useIsMobile } from '@/hooks/useDevice'
import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  Camera,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Download,
  Target
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  const { user, logout } = useAuth()
  const { loading } = useRequireAuth()
  const { isInstallable, installApp } = usePWAContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transações', href: '/transactions', icon: CreditCard },
    { name: 'Contas', href: '/accounts', icon: PiggyBank },
    { name: 'Orçamentos', href: '/budgets', icon: PiggyBank },
    { name: 'Metas', href: '/goals', icon: Target },
    { name: 'IA & Análises', href: '/analytics', icon: Target },
    { name: 'OCR Upload', href: '/ocr', icon: Camera },
    { name: 'Análise PDF', href: '/pdf-analysis', icon: FileText },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onToggle={() => setMobileDrawerOpen(!mobileDrawerOpen)}
      />

      {/* Desktop sidebar - hidden on mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GF</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Gestor Financeiro</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GF</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Gestor Financeiro</span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            {isInstallable && (
              <button
                onClick={installApp}
                className="flex items-center w-full px-3 py-2 mb-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Download className="h-5 w-5 mr-3" />
                Instalar App
              </button>
            )}

            <div className="mb-2">
              <ThemeToggle className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" />
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <MobileMenuButton
                onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                isOpen={mobileDrawerOpen}
              />
              {/* Desktop sidebar toggle - hidden on mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:block text-gray-400 hover:text-gray-600"
              >
                <Menu className="h-6 w-6" />
              </button>
              {title && (
                <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">{title}</h1>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className={`p-4 sm:p-6 lg:p-8 ${isMobile ? 'pb-20' : ''}`}>
          {children}
        </main>
      </div>

      {/* Bottom Navigation for mobile */}
      <BottomNavigation />
    </div>
  )
}
