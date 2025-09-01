// Performance Optimization System
import React from 'react'

export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
  bundleSize: number
  cacheHitRate: number
  memoryUsage: number
}

export interface OptimizationConfig {
  enableLazyLoading: boolean
  enableImageOptimization: boolean
  enableCodeSplitting: boolean
  enablePreloading: boolean
  enableServiceWorker: boolean
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative'
}

export interface ResourceHint {
  type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch'
  href: string
  as?: string
  crossorigin?: boolean
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private config: OptimizationConfig
  private metrics: PerformanceMetrics
  private observer: IntersectionObserver | null = null
  private performanceObserver: PerformanceObserver | null = null

  private constructor() {
    this.config = this.getDefaultConfig()
    this.metrics = this.initializeMetrics()
    this.setupPerformanceMonitoring()
    this.setupLazyLoading()
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  private getDefaultConfig(): OptimizationConfig {
    return {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enablePreloading: true,
      enableServiceWorker: true,
      cacheStrategy: 'moderate'
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      bundleSize: 0,
      cacheHitRate: 0,
      memoryUsage: 0
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    try {
      // Monitor navigation timing
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart
            this.metrics.renderTime = navEntry.domContentLoadedEventEnd - navEntry.fetchStart
          }
          
          if (entry.entryType === 'measure') {
            if (entry.name === 'interaction-time') {
              this.metrics.interactionTime = entry.duration
            }
          }
        })
      })

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'measure', 'paint'] 
      })

      // Monitor memory usage
      this.monitorMemoryUsage()
      
      // Monitor bundle size
      this.calculateBundleSize()

    } catch (error) {
      console.warn('Performance monitoring not available:', error)
    }
  }

  private setupLazyLoading(): void {
    if (typeof window === 'undefined' || !this.config.enableLazyLoading) return

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            this.loadLazyElement(target)
            this.observer?.unobserve(target)
          }
        })
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      })
    }
  }

  private loadLazyElement(element: HTMLElement): void {
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement
      const dataSrc = img.getAttribute('data-src')
      if (dataSrc) {
        img.src = dataSrc
        img.removeAttribute('data-src')
        img.classList.remove('lazy')
        img.classList.add('loaded')
      }
    }

    // Handle lazy components
    if (element.hasAttribute('data-lazy-component')) {
      const componentName = element.getAttribute('data-lazy-component')
      this.loadLazyComponent(componentName!, element)
    }
  }

  private async loadLazyComponent(componentName: string, element: HTMLElement): Promise<void> {
    try {
      // Dynamic import based on component name
      let component
      switch (componentName) {
        case 'IntelligentInsights':
          component = await import('@/components/IntelligentInsights')
          break
        // Add more lazy components as needed
        default:
          console.warn(`Unknown lazy component: ${componentName}`)
          return
      }

      // Mark as loaded
      element.setAttribute('data-lazy-loaded', 'true')
      
    } catch (error) {
      console.error(`Failed to load lazy component ${componentName}:`, error)
    }
  }

  private monitorMemoryUsage(): void {
    if (typeof window === 'undefined') return

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
      }
    }

    updateMemoryUsage()
    setInterval(updateMemoryUsage, 30000) // Update every 30 seconds
  }

  private calculateBundleSize(): void {
    if (typeof window === 'undefined') return

    // Estimate bundle size from loaded resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    let totalSize = 0

    resources.forEach(resource => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        totalSize += resource.transferSize || 0
      }
    })

    this.metrics.bundleSize = totalSize / 1024 // KB
  }

  // Public API methods
  enableLazyLoading(element: HTMLElement): void {
    if (this.observer && this.config.enableLazyLoading) {
      this.observer.observe(element)
    }
  }

  optimizeImage(img: HTMLImageElement, options: {
    quality?: number
    format?: 'webp' | 'avif' | 'auto'
    sizes?: string
  } = {}): void {
    if (!this.config.enableImageOptimization) return

    const { quality = 80, format = 'auto', sizes } = options

    // Add loading="lazy" for native lazy loading
    img.loading = 'lazy'

    // Add sizes attribute for responsive images
    if (sizes) {
      img.sizes = sizes
    }

    // Add data attributes for optimization
    img.setAttribute('data-quality', quality.toString())
    img.setAttribute('data-format', format)

    // Add to lazy loading observer
    if (img.hasAttribute('data-src')) {
      this.enableLazyLoading(img)
    }
  }

  preloadResource(href: string, as: string, crossorigin?: boolean): void {
    if (!this.config.enablePreloading || typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (crossorigin) link.crossOrigin = 'anonymous'

    document.head.appendChild(link)
  }

  prefetchResource(href: string): void {
    if (!this.config.enablePreloading || typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href

    document.head.appendChild(link)
  }

  addResourceHints(hints: ResourceHint[]): void {
    if (typeof document === 'undefined') return

    hints.forEach(hint => {
      const link = document.createElement('link')
      link.rel = hint.type
      link.href = hint.href
      
      if (hint.as) link.as = hint.as
      if (hint.crossorigin) link.crossOrigin = 'anonymous'

      document.head.appendChild(link)
    })
  }

  measureInteraction(name: string, fn: () => void | Promise<void>): void {
    const startTime = performance.now()
    
    const measure = () => {
      const endTime = performance.now()
      performance.mark(`${name}-end`)
      performance.measure(`interaction-time`, `${name}-start`, `${name}-end`)
    }

    performance.mark(`${name}-start`)
    
    const result = fn()
    if (result instanceof Promise) {
      result.then(measure).catch(measure)
    } else {
      measure()
    }
  }

  // Bundle splitting helpers
  async loadChunk(chunkName: string): Promise<any> {
    try {
      switch (chunkName) {
        case 'analytics':
          return await import('@/app/analytics/page')
        case 'ml-engine':
          return await import('@/lib/ml-engine')
        case 'biometric-auth':
          return await import('@/lib/biometric-auth')
        default:
          throw new Error(`Unknown chunk: ${chunkName}`)
      }
    } catch (error) {
      console.error(`Failed to load chunk ${chunkName}:`, error)
      throw error
    }
  }

  // Performance optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.metrics.loadTime > 3000) {
      recommendations.push('Consider enabling more aggressive caching')
      recommendations.push('Optimize bundle size by removing unused dependencies')
    }
    
    if (this.metrics.bundleSize > 1000) {
      recommendations.push('Enable code splitting for better performance')
      recommendations.push('Consider lazy loading non-critical components')
    }
    
    if (this.metrics.memoryUsage > 50) {
      recommendations.push('Monitor memory usage - consider optimizing large objects')
    }
    
    if (this.metrics.cacheHitRate < 0.7) {
      recommendations.push('Improve cache strategy for better performance')
    }

    return recommendations
  }

  // Configuration methods
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Reinitialize based on new config
    if (newConfig.enableLazyLoading !== undefined) {
      if (newConfig.enableLazyLoading && !this.observer) {
        this.setupLazyLoading()
      } else if (!newConfig.enableLazyLoading && this.observer) {
        this.observer.disconnect()
        this.observer = null
      }
    }
  }

  getConfig(): OptimizationConfig {
    return { ...this.config }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Critical resource preloading
  preloadCriticalResources(): void {
    const criticalResources = [
      { href: '/api/dashboard', as: 'fetch' },
      { href: '/fonts/inter.woff2', as: 'font', crossorigin: true },
      { href: '/icons/icon-192x192.png', as: 'image' }
    ]

    criticalResources.forEach(resource => {
      this.preloadResource(resource.href, resource.as, resource.crossorigin)
    })
  }

  // Service Worker integration
  async registerServiceWorker(): Promise<boolean> {
    if (!this.config.enableServiceWorker || typeof navigator === 'undefined') {
      return false
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdate()
              }
            })
          }
        })

        return true
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        return false
      }
    }

    return false
  }

  private notifyUpdate(): void {
    // Dispatch custom event for update notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sw-update-available'))
    }
  }

  // Cleanup
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance()

// Utility functions for React components
export function withPerformanceOptimization<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function OptimizedComponent(props: T) {
    React.useEffect(() => {
      performanceOptimizer.measureInteraction('component-render', () => {
        // Component rendered
      })
    }, [])

    return React.createElement(Component, props)
  }
}

export function useLazyLoading(ref: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (ref.current) {
      performanceOptimizer.enableLazyLoading(ref.current)
    }
  }, [ref])
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState(performanceOptimizer.getMetrics())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceOptimizer.getMetrics())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return metrics
}
