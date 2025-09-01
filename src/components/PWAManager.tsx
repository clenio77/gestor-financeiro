'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'
import { performanceOptimizer } from '@/lib/performance-optimizer'
import { cacheManager } from '@/lib/cache-manager'

interface PWAManagerProps {
  children: React.ReactNode
}

export function PWAManager({ children }: PWAManagerProps) {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState({ pending: 0, failed: 0 })
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    initializePWA()
  }, [])

  const initializePWA = async () => {
    // Register service worker
    await performanceOptimizer.registerServiceWorker()
    
    // Setup install prompt
    setupInstallPrompt()
    
    // Setup update notifications
    setupUpdateNotifications()
    
    // Setup network status
    setupNetworkStatus()
    
    // Setup sync status monitoring
    setupSyncStatusMonitoring()
    
    // Preload critical resources
    performanceOptimizer.preloadCriticalResources()
    
    // Check if already installed
    checkInstallStatus()
  }

  const setupInstallPrompt = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    })

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    })
  }

  const setupUpdateNotifications = () => {
    window.addEventListener('sw-update-available', () => {
      setUpdateAvailable(true)
    })
  }

  const setupNetworkStatus = () => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    updateOnlineStatus()
  }

  const setupSyncStatusMonitoring = () => {
    const updateSyncStatus = () => {
      setSyncStatus(cacheManager.getSyncQueueStatus())
    }

    updateSyncStatus()
    setInterval(updateSyncStatus, 5000) // Update every 5 seconds
  }

  const checkInstallStatus = () => {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setIsInstallable(false)
    }
    
    setDeferredPrompt(null)
  }

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      })
    }
  }

  const dismissUpdate = () => {
    setUpdateAvailable(false)
  }

  return (
    <>
      {children}
      
      {/* Install Prompt */}
      {isInstallable && !isInstalled && (
        <div className={`fixed bottom-4 left-4 right-4 z-50 ${isMobile ? 'mx-4' : 'max-w-md mx-auto'}`}>
          <div className={`p-4 rounded-lg shadow-lg border ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📱</div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Instalar Gestor Financeiro
                </h3>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Instale o app para uma experiência mais rápida e acesso offline.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleInstall}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Instalar
                  </button>
                  <button
                    onClick={() => setIsInstallable(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Notification */}
      {updateAvailable && (
        <div className={`fixed top-4 left-4 right-4 z-50 ${isMobile ? 'mx-4' : 'max-w-md mx-auto'}`}>
          <div className={`p-4 rounded-lg shadow-lg border ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔄</div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Atualização Disponível
                </h3>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Uma nova versão do app está disponível com melhorias e correções.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdate}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Atualizar
                  </button>
                  <button
                    onClick={dismissUpdate}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Depois
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className={`fixed top-0 left-0 right-0 z-40 ${
          isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
        } px-4 py-2 text-center text-sm`}>
          <div className="flex items-center justify-center space-x-2">
            <span>📡</span>
            <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {(syncStatus.pending > 0 || syncStatus.failed > 0) && (
        <div className={`fixed bottom-20 right-4 z-40 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-lg p-3 shadow-lg max-w-xs`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus.pending > 0 ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
            }`} />
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {syncStatus.pending > 0 && (
                <div>Sincronizando {syncStatus.pending} item(s)...</div>
              )}
              {syncStatus.failed > 0 && (
                <div className={`${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {syncStatus.failed} falha(s) na sincronização
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Performance Status Component
export function PerformanceStatus() {
  const { isDark } = useTheme()
  const [metrics, setMetrics] = useState(performanceOptimizer.getMetrics())
  const [cacheStats, setCacheStats] = useState(cacheManager.getCacheStats())
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceOptimizer.getMetrics())
      setCacheStats(cacheManager.getCacheStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return isDark ? 'text-green-400' : 'text-green-600'
    if (value <= thresholds[1]) return isDark ? 'text-yellow-400' : 'text-yellow-600'
    return isDark ? 'text-red-400' : 'text-red-600'
  }

  if (!showDetails) {
    return (
      <button
        onClick={() => setShowDetails(true)}
        className={`fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg transition-all ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
            : 'bg-white hover:bg-gray-50 text-gray-700'
        } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      >
        ⚡
      </button>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 w-80 rounded-lg shadow-lg border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Performance
        </h3>
        <button
          onClick={() => setShowDetails(false)}
          className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Load Time:</span>
          <span className={getPerformanceColor(metrics.loadTime, [2000, 4000])}>
            {metrics.loadTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Bundle Size:</span>
          <span className={getPerformanceColor(metrics.bundleSize, [500, 1000])}>
            {metrics.bundleSize.toFixed(0)}KB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Memory:</span>
          <span className={getPerformanceColor(metrics.memoryUsage, [30, 60])}>
            {metrics.memoryUsage.toFixed(1)}MB
          </span>
        </div>

        <div className="border-t pt-2 mt-2">
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
            Cache Status:
          </div>
          {Object.entries(cacheStats).map(([strategy, stats]) => (
            <div key={strategy} className="flex justify-between text-xs">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {strategy}:
              </span>
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                {stats.entries} items ({(stats.size / 1024).toFixed(1)}KB)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Hook for PWA features
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check install status
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Network status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()

    // Update notifications
    window.addEventListener('sw-update-available', () => setUpdateAvailable(true))

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const addToSyncQueue = (item: any) => {
    cacheManager.addToSyncQueue(item)
  }

  const clearCache = async () => {
    await cacheManager.invalidateAll()
  }

  return {
    isInstalled,
    isOnline,
    updateAvailable,
    addToSyncQueue,
    clearCache
  }
}
