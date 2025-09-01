// Advanced Service Worker for PWA functionality
const CACHE_NAME = 'gestor-financeiro-v3'
const STATIC_CACHE = 'static-v3'
const DYNAMIC_CACHE = 'dynamic-v3'
const API_CACHE = 'api-v3'

const urlsToCache = [
  '/',
  '/dashboard',
  '/transactions',
  '/accounts',
  '/budgets',
  '/goals',
  '/analytics',
  '/settings',
  '/ocr',
  '/pdf-analysis',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-72x72.png'
]

const API_ENDPOINTS = [
  '/api/transactions',
  '/api/accounts',
  '/api/budgets',
  '/api/goals',
  '/api/dashboard',
  '/api/analytics'
]

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Install event - cache resources with advanced strategies
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static resources')
        return cache.addAll(urlsToCache)
      }),
      // Pre-cache critical API endpoints
      caches.open(API_CACHE).then(cache => {
        console.log('Pre-caching API endpoints')
        // Pre-cache will be done on first request
        return Promise.resolve()
      })
    ]).then(() => {
      console.log('All resources cached')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE]

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker activated')
      return self.clients.claim()
    })
  )
})

// Advanced fetch event with multiple cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle different types of requests with appropriate strategies
  if (request.method !== 'GET') {
    // Don't cache non-GET requests
    return
  }

  // API requests - Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Static assets - Cache First
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Navigation requests - Stale While Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  // Default strategy - Network First
  event.respondWith(handleDefault(request))
})

// Background Sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncOfflineTransactions())
  }
  
  if (event.tag === 'sync-financial-data') {
    event.waitUntil(syncFinancialData())
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag)
  
  event.notification.close()
  
  // Handle different notification actions
  const action = event.action
  const notificationData = event.notification.data || {}
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Send message to client about the notification action
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action: action,
              data: notificationData
            })
          })
        }
      }
      
      // If app is not open, open it
      let targetUrl = '/'
      
      // Navigate to specific pages based on notification type
      switch (event.notification.tag) {
        case 'spending_limit':
          targetUrl = '/transactions'
          break
        case 'goal_deadline':
          targetUrl = '/goals'
          break
        case 'budget_exceeded':
          targetUrl = '/budgets'
          break
        case 'unusual_activity':
          targetUrl = '/transactions'
          break
        case 'milestone':
          targetUrl = '/goals'
          break
        default:
          targetUrl = '/dashboard'
      }
      
      // Handle specific actions
      if (action === 'view_transactions') {
        targetUrl = '/transactions'
      } else if (action === 'view_goal') {
        targetUrl = '/goals'
      } else if (action === 'view_budget') {
        targetUrl = '/budgets'
      } else if (action === 'contribute_goal') {
        targetUrl = '/goals'
      }
      
      return clients.openWindow(targetUrl)
    })
  )
})

// Push notification handler (for future server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  if (!event.data) {
    return
  }
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Periodic background sync for checking financial alerts
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag)
  
  if (event.tag === 'financial-alerts-check') {
    event.waitUntil(checkFinancialAlerts())
  }
})

// Helper functions
async function syncOfflineTransactions() {
  try {
    console.log('Syncing offline transactions...')
    
    // Get offline transactions from IndexedDB
    const offlineTransactions = await getOfflineTransactions()
    
    if (offlineTransactions.length === 0) {
      console.log('No offline transactions to sync')
      return
    }
    
    // Sync each transaction
    for (const transaction of offlineTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction)
        })
        
        if (response.ok) {
          await removeOfflineTransaction(transaction.id)
          console.log('Transaction synced:', transaction.id)
        }
      } catch (error) {
        console.error('Failed to sync transaction:', transaction.id, error)
      }
    }
    
    // Notify user about sync completion
    await self.registration.showNotification('💾 Dados sincronizados', {
      body: `${offlineTransactions.length} transações foram sincronizadas com sucesso!`,
      tag: 'sync-complete',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png'
    })
    
  } catch (error) {
    console.error('Error syncing offline transactions:', error)
  }
}

async function syncFinancialData() {
  try {
    console.log('Syncing financial data...')
    
    // Fetch latest financial data to update cache
    const endpoints = [
      '/api/transactions',
      '/api/accounts',
      '/api/budgets',
      '/api/goals'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(endpoint, response.clone())
        }
      } catch (error) {
        console.error('Failed to sync endpoint:', endpoint, error)
      }
    }
    
  } catch (error) {
    console.error('Error syncing financial data:', error)
  }
}

async function checkFinancialAlerts() {
  try {
    console.log('Checking financial alerts...')
    
    // This would typically fetch data and run alert checks
    // For now, we'll just log that the check happened
    console.log('Financial alerts check completed')
    
  } catch (error) {
    console.error('Error checking financial alerts:', error)
  }
}

// IndexedDB helpers (simplified - would need full implementation)
async function getOfflineTransactions() {
  // TODO: Implement IndexedDB operations
  return []
}

async function removeOfflineTransaction(id) {
  // TODO: Implement IndexedDB operations
  console.log('Removing offline transaction:', id)
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
  
  if (event.data && event.data.type === 'CACHE_FINANCIAL_DATA') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.put('/api/financial-summary', new Response(JSON.stringify(event.data.data)))
      })
    )
  }
})

// Cache strategy implementations
async function handleApiRequest(request) {
  const cacheName = API_CACHE
  const cache = await caches.open(cacheName)

  try {
    // Try network first
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    // If network fails, try cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No network connection available'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)

  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Return cached version or 404
    return cachedResponse || new Response('Not found', { status: 404 })
  }
}

async function handleNavigation(request) {
  const cache = await caches.open(DYNAMIC_CACHE)

  try {
    // Try network first
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    // If network fails, try cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page
    return caches.match('/offline')
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page
    return caches.match('/offline')
  }
}

async function handleDefault(request) {
  const cache = await caches.open(DYNAMIC_CACHE)

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cachedResponse = await cache.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)
}

console.log('Advanced Service Worker loaded successfully')
