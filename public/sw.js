// Service Worker for PWA functionality with Notifications
const CACHE_NAME = 'gestor-financeiro-v2'
const urlsToCache = [
  '/',
  '/dashboard',
  '/transactions',
  '/accounts',
  '/budgets',
  '/goals',
  '/settings',
  '/ocr',
  '/pdf-analysis',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('All resources cached')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        }).catch(() => {
          // If both cache and network fail, show offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/offline')
          }
        })
      })
  )
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

console.log('Service Worker loaded successfully')
