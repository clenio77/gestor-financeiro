'use client'

import { useState, useEffect } from 'react'

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  orientation: 'portrait' | 'landscape'
  isStandalone: boolean
  platform: string
  userAgent: string
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'lg',
    orientation: 'landscape',
    isStandalone: false,
    platform: 'unknown',
    userAgent: ''
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent
      const platform = navigator.platform
      
      // Screen size detection
      let screenSize: DeviceInfo['screenSize'] = 'lg'
      if (width < 640) screenSize = 'xs'
      else if (width < 768) screenSize = 'sm'
      else if (width < 1024) screenSize = 'md'
      else if (width < 1280) screenSize = 'lg'
      else if (width < 1536) screenSize = 'xl'
      else screenSize = '2xl'

      // Device type detection
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      
      // Touch device detection
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Orientation detection
      const orientation = height > width ? 'portrait' : 'landscape'

      // PWA standalone detection
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        orientation,
        isStandalone,
        platform,
        userAgent
      })
    }

    // Initial detection
    updateDeviceInfo()

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

// Hook for specific device checks
export function useIsMobile(): boolean {
  const { isMobile } = useDevice()
  return isMobile
}

export function useIsTablet(): boolean {
  const { isTablet } = useDevice()
  return isTablet
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useDevice()
  return isDesktop
}

export function useIsTouchDevice(): boolean {
  const { isTouchDevice } = useDevice()
  return isTouchDevice
}

export function useScreenSize(): DeviceInfo['screenSize'] {
  const { screenSize } = useDevice()
  return screenSize
}

export function useOrientation(): DeviceInfo['orientation'] {
  const { orientation } = useDevice()
  return orientation
}

export function useIsStandalone(): boolean {
  const { isStandalone } = useDevice()
  return isStandalone
}

// Utility functions for responsive design
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export function getBreakpointValue(size: keyof typeof breakpoints): number {
  return breakpoints[size]
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Specific media query hooks
export function useIsSmallScreen(): boolean {
  return useMediaQuery('(max-width: 640px)')
}

export function useIsMediumScreen(): boolean {
  return useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
}

export function useIsLargeScreen(): boolean {
  return useMediaQuery('(min-width: 1025px)')
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)')
}

// Device capabilities detection
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    hasCamera: false,
    hasGeolocation: false,
    hasNotifications: false,
    hasServiceWorker: false,
    hasWebGL: false,
    hasWebRTC: false,
    hasWebAuthn: false,
    hasVibration: false,
    hasDeviceMotion: false,
    hasDeviceOrientation: false,
    hasShare: false,
    hasClipboard: false
  })

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities = {
        hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        hasGeolocation: !!navigator.geolocation,
        hasNotifications: 'Notification' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasWebGL: !!document.createElement('canvas').getContext('webgl'),
        hasWebRTC: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
        hasWebAuthn: !!(navigator.credentials && navigator.credentials.create),
        hasVibration: !!navigator.vibrate,
        hasDeviceMotion: 'DeviceMotionEvent' in window,
        hasDeviceOrientation: 'DeviceOrientationEvent' in window,
        hasShare: !!navigator.share,
        hasClipboard: !!(navigator.clipboard && navigator.clipboard.writeText)
      }

      setCapabilities(newCapabilities)
    }

    checkCapabilities()
  }, [])

  return capabilities
}

// Network information hook
export function useNetworkInfo() {
  const [networkInfo, setNetworkInfo] = useState({
    isOnline: true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  })

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      setNetworkInfo({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      })
    }

    updateNetworkInfo()

    window.addEventListener('online', updateNetworkInfo)
    window.addEventListener('offline', updateNetworkInfo)

    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo)
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo)
      window.removeEventListener('offline', updateNetworkInfo)
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [])

  return networkInfo
}
