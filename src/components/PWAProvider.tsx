"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePWA, useNotifications } from '@/hooks/usePWA'
import { useToast } from '@/hooks/use-toast'

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  installApp: () => Promise<boolean>
  showNotification: (title: string, options?: NotificationOptions) => Notification | null
  requestNotificationPermission: () => Promise<NotificationPermission>
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: ReactNode }) {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA()
  const { showNotification, requestPermission } = useNotifications()
  const { toast } = useToast()
  const [hasShownInstallPrompt, setHasShownInstallPrompt] = useState(false)

  // Show install prompt after 30 seconds if app is installable
  useEffect(() => {
    if (isInstallable && !isInstalled && !hasShownInstallPrompt) {
      const timer = setTimeout(() => {
        toast({
          title: "Instalar App",
          description: "Instale o Gestor Financeiro para uma melhor experiência!",
          action: (
            <button
              onClick={async () => {
                const success = await installApp()
                if (success) {
                  toast({
                    title: "App Instalado!",
                    description: "O Gestor Financeiro foi instalado com sucesso.",
                    variant: "success"
                  })
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Instalar
            </button>
          ),
        })
        setHasShownInstallPrompt(true)
      }, 30000) // 30 seconds

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, hasShownInstallPrompt, installApp, toast])

  // Show offline/online status
  useEffect(() => {
    if (!isOnline) {
      toast({
        title: "Modo Offline",
        description: "Você está offline. Algumas funcionalidades podem estar limitadas.",
        variant: "warning"
      })
    } else {
      // Only show online message if we were previously offline
      const wasOffline = localStorage.getItem('was_offline')
      if (wasOffline === 'true') {
        toast({
          title: "Conectado",
          description: "Você está online novamente!",
          variant: "success"
        })
        localStorage.removeItem('was_offline')
      }
    }

    // Store offline state
    if (!isOnline) {
      localStorage.setItem('was_offline', 'true')
    }
  }, [isOnline, toast])

  // Request notification permission on first visit
  useEffect(() => {
    const hasRequestedPermission = localStorage.getItem('notification_permission_requested')
    if (!hasRequestedPermission && 'Notification' in window) {
      setTimeout(async () => {
        await requestPermission()
        localStorage.setItem('notification_permission_requested', 'true')
      }, 5000) // Wait 5 seconds before asking
    }
  }, [requestPermission])

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    showNotification,
    requestNotificationPermission: requestPermission,
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
      {/* PWA Install Banner */}
      {isInstallable && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Instalar App</h3>
              <p className="text-xs opacity-90">Acesso rápido e offline</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setHasShownInstallPrompt(true)}
                className="text-xs px-2 py-1 rounded border border-white/30 hover:bg-white/10"
              >
                Depois
              </button>
              <button
                onClick={async () => {
                  const success = await installApp()
                  if (success) {
                    toast({
                      title: "App Instalado!",
                      description: "O Gestor Financeiro foi instalado com sucesso.",
                      variant: "success"
                    })
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-white text-blue-600 hover:bg-gray-100"
              >
                Instalar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          📱 Modo Offline - Algumas funcionalidades podem estar limitadas
        </div>
      )}
    </PWAContext.Provider>
  )
}

export function usePWAContext() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider')
  }
  return context
}
