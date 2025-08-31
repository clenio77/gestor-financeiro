"use client"

import { useState, useEffect } from 'react'
import { PWAInstallPrompt } from '@/types'

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check if app is already installed
    if (typeof window !== 'undefined') {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)
      setIsOnline(navigator.onLine)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as any
      setDeferredPrompt({
        prompt: () => installEvent.prompt(),
        userChoice: installEvent.userChoice
      })
      setIsInstallable(true)
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('Error installing app:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
  }
}

export function useOfflineStorage() {
  const [offlineData, setOfflineData] = useState<any>(null)

  const saveOfflineData = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`offline_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Error saving offline data:', error)
      }
    }
  }

  const getOfflineData = (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`offline_${key}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.data
        }
      } catch (error) {
        console.error('Error getting offline data:', error)
      }
    }
    return null
  }

  const clearOfflineData = (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`offline_${key}`)
    }
  }

  const syncOfflineData = async () => {
    // Implementation for syncing offline data when back online
    // This would depend on your specific sync strategy
    console.log('Syncing offline data...')
  }

  return {
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    syncOfflineData,
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && typeof window !== 'undefined') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      })

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      return notification
    }
    return null
  }

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  }
}
