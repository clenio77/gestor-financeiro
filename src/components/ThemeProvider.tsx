'use client'

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'
import { createContext, useContext, useEffect, useState } from 'react'

// Extended theme context with additional features
interface ExtendedThemeContextType {
  theme: string | undefined
  setTheme: (theme: string) => void
  systemTheme: string | undefined
  resolvedTheme: string | undefined
  themes: string[]
  // Additional features
  isDark: boolean
  isLight: boolean
  isSystem: boolean
  toggleTheme: () => void
  // Accessibility features
  reduceMotion: boolean
  setReduceMotion: (reduce: boolean) => void
  highContrast: boolean
  setHighContrast: (contrast: boolean) => void
}

const ExtendedThemeContext = createContext<ExtendedThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  // Load accessibility preferences
  useEffect(() => {
    setMounted(true)
    
    // Load reduce motion preference
    const savedReduceMotion = localStorage.getItem('reduce-motion')
    if (savedReduceMotion) {
      setReduceMotion(JSON.parse(savedReduceMotion))
    } else {
      // Check system preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setReduceMotion(prefersReducedMotion)
    }

    // Load high contrast preference
    const savedHighContrast = localStorage.getItem('high-contrast')
    if (savedHighContrast) {
      setHighContrast(JSON.parse(savedHighContrast))
    } else {
      // Check system preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      setHighContrast(prefersHighContrast)
    }
  }, [])

  // Save accessibility preferences
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('reduce-motion', JSON.stringify(reduceMotion))
      document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    }
  }, [reduceMotion, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('high-contrast', JSON.stringify(highContrast))
      document.documentElement.classList.toggle('high-contrast', highContrast)
    }
  }, [highContrast, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={reduceMotion}
    >
      <ThemeWrapper
        reduceMotion={reduceMotion}
        setReduceMotion={setReduceMotion}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
      >
        {children}
      </ThemeWrapper>
    </NextThemesProvider>
  )
}

function ThemeWrapper({ 
  children, 
  reduceMotion, 
  setReduceMotion, 
  highContrast, 
  setHighContrast 
}: {
  children: React.ReactNode
  reduceMotion: boolean
  setReduceMotion: (reduce: boolean) => void
  highContrast: boolean
  setHighContrast: (contrast: boolean) => void
}) {
  const { theme, setTheme, systemTheme, resolvedTheme, themes } = useNextTheme()

  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'
  const isSystem = theme === 'system'

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const contextValue: ExtendedThemeContextType = {
    theme,
    setTheme,
    systemTheme,
    resolvedTheme,
    themes: themes || ['light', 'dark', 'system'],
    isDark,
    isLight,
    isSystem,
    toggleTheme,
    reduceMotion,
    setReduceMotion,
    highContrast,
    setHighContrast
  }

  return (
    <ExtendedThemeContext.Provider value={contextValue}>
      {children}
    </ExtendedThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ExtendedThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme toggle component
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, isDark, isLight, isSystem } = useTheme()

  const getIcon = () => {
    if (isLight) return '☀️'
    if (isDark) return '🌙'
    if (isSystem) return '💻'
    return '🌓'
  }

  const getLabel = () => {
    if (isLight) return 'Modo claro'
    if (isDark) return 'Modo escuro'
    if (isSystem) return 'Sistema'
    return 'Alternar tema'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center rounded-md p-2
        text-sm font-medium transition-colors
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      title={getLabel()}
      aria-label={getLabel()}
    >
      <span className="text-lg">{getIcon()}</span>
      <span className="ml-2 hidden sm:inline">{getLabel()}</span>
    </button>
  )
}

// Accessibility controls component
export function AccessibilityControls({ className }: { className?: string }) {
  const { reduceMotion, setReduceMotion, highContrast, setHighContrast } = useTheme()

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor="reduce-motion" className="text-sm font-medium">
          Reduzir animações
        </label>
        <input
          id="reduce-motion"
          type="checkbox"
          checked={reduceMotion}
          onChange={(e) => setReduceMotion(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <label htmlFor="high-contrast" className="text-sm font-medium">
          Alto contraste
        </label>
        <input
          id="high-contrast"
          type="checkbox"
          checked={highContrast}
          onChange={(e) => setHighContrast(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

// Theme-aware loading spinner
export function LoadingSpinner({ className }: { className?: string }) {
  const { isDark, reduceMotion } = useTheme()
  
  return (
    <div
      className={`
        inline-block animate-spin rounded-full border-2 border-solid
        ${isDark ? 'border-gray-600 border-t-white' : 'border-gray-300 border-t-gray-900'}
        ${reduceMotion ? 'animate-none' : 'animate-spin'}
        ${className}
      `}
      role="status"
      aria-label="Carregando..."
    >
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

// Theme-aware card component
export function ThemeCard({ 
  children, 
  className,
  variant = 'default'
}: { 
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined'
}) {
  const { isDark } = useTheme()
  
  const baseClasses = 'rounded-lg transition-colors'
  const variantClasses = {
    default: `bg-white dark:bg-gray-800 ${isDark ? 'border border-gray-700' : 'shadow-sm border border-gray-200'}`,
    elevated: `bg-white dark:bg-gray-800 ${isDark ? 'shadow-lg shadow-gray-900/20' : 'shadow-lg'}`,
    outlined: 'border-2 border-gray-200 dark:border-gray-700 bg-transparent'
  }
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}
