// Advanced Cache Manager for PWA
export interface CacheStrategy {
  name: string
  maxAge: number
  maxEntries: number
  networkFirst?: boolean
  cacheFirst?: boolean
  staleWhileRevalidate?: boolean
}

export interface CacheEntry {
  data: any
  timestamp: number
  etag?: string
  version: string
}

export interface SyncQueueItem {
  id: string
  type: 'transaction' | 'goal' | 'budget' | 'account'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
}

class CacheManager {
  private static instance: CacheManager
  private cacheStrategies: Map<string, CacheStrategy> = new Map()
  private syncQueue: SyncQueueItem[] = []
  private isOnline: boolean = true
  private version: string = '1.0.0'

  private constructor() {
    this.initializeCacheStrategies()
    this.setupNetworkListeners()
    this.loadSyncQueue()
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  private initializeCacheStrategies(): void {
    // API data cache - short term, network first
    this.cacheStrategies.set('api-data', {
      name: 'api-data',
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 100,
      networkFirst: true
    })

    // Static assets - long term, cache first
    this.cacheStrategies.set('static-assets', {
      name: 'static-assets',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 200,
      cacheFirst: true
    })

    // User data - stale while revalidate
    this.cacheStrategies.set('user-data', {
      name: 'user-data',
      maxAge: 15 * 60 * 1000, // 15 minutes
      maxEntries: 50,
      staleWhileRevalidate: true
    })

    // ML insights - medium term cache
    this.cacheStrategies.set('ml-insights', {
      name: 'ml-insights',
      maxAge: 60 * 60 * 1000, // 1 hour
      maxEntries: 30,
      cacheFirst: true
    })
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    this.isOnline = navigator.onLine
  }

  private loadSyncQueue(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('sync_queue')
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
    }
  }

  private saveSyncQueue(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  // Cache operations
  async get(key: string, strategyName: string = 'api-data'): Promise<any> {
    const strategy = this.cacheStrategies.get(strategyName)
    if (!strategy) return null

    const cacheKey = `${strategyName}:${key}`
    
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const entry: CacheEntry = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() - entry.timestamp > strategy.maxAge) {
        localStorage.removeItem(cacheKey)
        return null
      }

      // Check version compatibility
      if (entry.version !== this.version) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return entry.data
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, data: any, strategyName: string = 'api-data', etag?: string): Promise<void> {
    const strategy = this.cacheStrategies.get(strategyName)
    if (!strategy) return

    const cacheKey = `${strategyName}:${key}`
    
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        etag,
        version: this.version
      }

      localStorage.setItem(cacheKey, JSON.stringify(entry))
      
      // Clean up old entries if needed
      this.cleanupCache(strategyName)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async invalidate(key: string, strategyName: string = 'api-data'): Promise<void> {
    const cacheKey = `${strategyName}:${key}`
    localStorage.removeItem(cacheKey)
  }

  async invalidateAll(strategyName?: string): Promise<void> {
    if (strategyName) {
      // Invalidate specific strategy
      const prefix = `${strategyName}:`
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key)
        }
      })
    } else {
      // Invalidate all cache strategies
      this.cacheStrategies.forEach((_, name) => {
        this.invalidateAll(name)
      })
    }
  }

  private cleanupCache(strategyName: string): void {
    const strategy = this.cacheStrategies.get(strategyName)
    if (!strategy) return

    const prefix = `${strategyName}:`
    const entries: { key: string; timestamp: number }[] = []

    // Collect all entries for this strategy
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        try {
          const entry: CacheEntry = JSON.parse(localStorage.getItem(key) || '{}')
          entries.push({ key, timestamp: entry.timestamp })
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key)
        }
      }
    })

    // Remove oldest entries if over limit
    if (entries.length > strategy.maxEntries) {
      entries.sort((a, b) => a.timestamp - b.timestamp)
      const toRemove = entries.slice(0, entries.length - strategy.maxEntries)
      toRemove.forEach(entry => localStorage.removeItem(entry.key))
    }
  }

  // Network-aware fetch with caching
  async fetchWithCache(
    url: string, 
    options: RequestInit = {}, 
    strategyName: string = 'api-data'
  ): Promise<any> {
    const strategy = this.cacheStrategies.get(strategyName)
    if (!strategy) {
      return fetch(url, options).then(r => r.json())
    }

    const cacheKey = url + JSON.stringify(options)

    // Network First Strategy
    if (strategy.networkFirst) {
      try {
        if (this.isOnline) {
          const response = await fetch(url, options)
          if (response.ok) {
            const data = await response.json()
            await this.set(cacheKey, data, strategyName, response.headers.get('etag') || undefined)
            return data
          }
        }
        // Fallback to cache
        return await this.get(cacheKey, strategyName)
      } catch (error) {
        return await this.get(cacheKey, strategyName)
      }
    }

    // Cache First Strategy
    if (strategy.cacheFirst) {
      const cached = await this.get(cacheKey, strategyName)
      if (cached) return cached

      try {
        if (this.isOnline) {
          const response = await fetch(url, options)
          if (response.ok) {
            const data = await response.json()
            await this.set(cacheKey, data, strategyName, response.headers.get('etag') || undefined)
            return data
          }
        }
      } catch (error) {
        console.error('Network fetch failed:', error)
      }
      return null
    }

    // Stale While Revalidate Strategy
    if (strategy.staleWhileRevalidate) {
      const cached = await this.get(cacheKey, strategyName)
      
      // Return cached data immediately if available
      if (cached) {
        // Revalidate in background
        if (this.isOnline) {
          fetch(url, options)
            .then(response => {
              if (response.ok) {
                const etag = response.headers.get('etag') || undefined
                return response.json().then(data => ({ data, etag }))
              }
              return null
            })
            .then(result => {
              if (result) {
                this.set(cacheKey, result.data, strategyName, result.etag)
              }
            })
            .catch(error => console.error('Background revalidation failed:', error))
        }
        return cached
      }

      // No cache, fetch from network
      try {
        if (this.isOnline) {
          const response = await fetch(url, options)
          if (response.ok) {
            const data = await response.json()
            await this.set(cacheKey, data, strategyName, response.headers.get('etag') || undefined)
            return data
          }
        }
      } catch (error) {
        console.error('Network fetch failed:', error)
      }
      return null
    }

    // Default: just fetch
    return fetch(url, options).then(r => r.json())
  }

  // Sync Queue Management
  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `${item.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.syncQueue.push(syncItem)
    this.saveSyncQueue()

    // Try to process immediately if online
    if (this.isOnline) {
      this.processSyncQueue()
    }
  }

  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return

    const itemsToProcess = [...this.syncQueue]
    
    for (const item of itemsToProcess) {
      try {
        await this.processSyncItem(item)
        
        // Remove successful item from queue
        this.syncQueue = this.syncQueue.filter(queueItem => queueItem.id !== item.id)
      } catch (error) {
        console.error('Sync item failed:', error)
        
        // Increment retry count
        const queueItem = this.syncQueue.find(qi => qi.id === item.id)
        if (queueItem) {
          queueItem.retryCount++
          
          // Remove if max retries reached
          if (queueItem.retryCount >= queueItem.maxRetries) {
            this.syncQueue = this.syncQueue.filter(qi => qi.id !== item.id)
            console.error('Max retries reached for sync item:', item)
          }
        }
      }
    }

    this.saveSyncQueue()
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const endpoint = this.getEndpointForType(item.type)
    let url = endpoint
    let method = 'POST'
    let body: string | undefined = JSON.stringify(item.data)

    switch (item.action) {
      case 'create':
        method = 'POST'
        break
      case 'update':
        method = 'PUT'
        url = `${endpoint}/${item.data.id}`
        break
      case 'delete':
        method = 'DELETE'
        url = `${endpoint}/${item.data.id}`
        body = undefined
        break
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here
      },
      body
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
    }

    // Invalidate related cache
    this.invalidateRelatedCache(item.type)
  }

  private getEndpointForType(type: string): string {
    const endpoints = {
      transaction: '/api/transactions',
      goal: '/api/goals',
      budget: '/api/budgets',
      account: '/api/accounts'
    }
    return endpoints[type as keyof typeof endpoints] || '/api/unknown'
  }

  private invalidateRelatedCache(type: string): void {
    // Invalidate API data cache for the specific type
    this.invalidate(`${type}s`, 'api-data')
    this.invalidate('dashboard', 'api-data')
    this.invalidate('analytics', 'ml-insights')
  }

  // Utility methods
  getCacheStats(): { [key: string]: { entries: number; size: number } } {
    const stats: { [key: string]: { entries: number; size: number } } = {}

    this.cacheStrategies.forEach((_, strategyName) => {
      const prefix = `${strategyName}:`
      let entries = 0
      let size = 0

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          entries++
          size += localStorage.getItem(key)?.length || 0
        }
      })

      stats[strategyName] = { entries, size }
    })

    return stats
  }

  getSyncQueueStatus(): { pending: number; failed: number } {
    const pending = this.syncQueue.filter(item => item.retryCount < item.maxRetries).length
    const failed = this.syncQueue.filter(item => item.retryCount >= item.maxRetries).length
    
    return { pending, failed }
  }

  isOnlineStatus(): boolean {
    return this.isOnline
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance()
