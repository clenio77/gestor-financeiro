import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { notificationManager, AlertRule } from '../notifications'

// Mock Service Worker and Notification API
const mockServiceWorkerRegistration = {
  showNotification: vi.fn(),
}

const mockNotification = vi.fn()

// Mock global objects
Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true,
})

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      ready: Promise.resolve(mockServiceWorkerRegistration),
    },
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    matchMedia: vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  },
  writable: true,
})

describe('NotificationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockNotification.permission = 'default'
    mockNotification.requestPermission = vi.fn().mockResolvedValue('granted')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = notificationManager
      const instance2 = notificationManager
      expect(instance1).toBe(instance2)
    })
  })

  describe('Permission Management', () => {
    it('should request notification permission', async () => {
      const permission = await notificationManager.requestPermission()
      expect(mockNotification.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should return granted if permission already granted', async () => {
      mockNotification.permission = 'granted'
      const permission = await notificationManager.requestPermission()
      expect(permission).toBe('granted')
    })

    it('should return denied if permission denied', async () => {
      mockNotification.permission = 'denied'
      const permission = await notificationManager.requestPermission()
      expect(permission).toBe('denied')
    })
  })

  describe('Notification Display', () => {
    beforeEach(() => {
      mockNotification.permission = 'granted'
    })

    it('should show notification with service worker', async () => {
      await notificationManager.showNotification({
        title: 'Test Notification',
        body: 'Test body',
        tag: 'test',
      })

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Notification',
        expect.objectContaining({
          body: 'Test body',
          tag: 'test',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        })
      )
    })

    it('should not show notification if permission denied', async () => {
      mockNotification.permission = 'denied'
      mockNotification.requestPermission = vi.fn().mockResolvedValue('denied')

      await notificationManager.showNotification({
        title: 'Test Notification',
        body: 'Test body',
      })

      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled()
    })
  })

  describe('Alert Rules Management', () => {
    it('should load default alert rules', () => {
      const rules = notificationManager.getAlertRules()
      expect(rules).toHaveLength(3)
      expect(rules[0].type).toBe('spending_limit')
      expect(rules[1].type).toBe('goal_deadline')
      expect(rules[2].type).toBe('budget_exceeded')
    })

    it('should update alert rule', () => {
      const rules = notificationManager.getAlertRules()
      const ruleId = rules[0].id

      notificationManager.updateAlertRule(ruleId, { enabled: false })
      const updatedRules = notificationManager.getAlertRules()
      const updatedRule = updatedRules.find(r => r.id === ruleId)

      expect(updatedRule?.enabled).toBe(false)
    })

    it('should add new alert rule', () => {
      const newRule: AlertRule = {
        id: 'test_rule',
        name: 'Test Rule',
        type: 'unusual_activity',
        conditions: { threshold: 1000 },
        enabled: true,
        channels: ['push'],
        frequency: 'immediate'
      }

      notificationManager.addAlertRule(newRule)
      const rules = notificationManager.getAlertRules()

      expect(rules).toHaveLength(4)
      expect(rules.find(r => r.id === 'test_rule')).toEqual(newRule)
    })

    it('should remove alert rule', () => {
      const rules = notificationManager.getAlertRules()
      const ruleId = rules[0].id

      notificationManager.removeAlertRule(ruleId)
      const updatedRules = notificationManager.getAlertRules()

      expect(updatedRules).toHaveLength(2)
      expect(updatedRules.find(r => r.id === ruleId)).toBeUndefined()
    })

    it('should save alert rules to localStorage', () => {
      const rules = notificationManager.getAlertRules()
      notificationManager.updateAlertRule(rules[0].id, { enabled: false })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'financial_alert_rules',
        expect.stringContaining(rules[0].id)
      )
    })
  })

  describe('Intelligent Alerts', () => {
    beforeEach(() => {
      mockNotification.permission = 'granted'
    })

    it('should check spending limits', async () => {
      const transactions = [
        { date: new Date().toISOString().split('T')[0], type: 'expense', amount: 150 },
        { date: new Date().toISOString().split('T')[0], type: 'expense', amount: 100 },
      ]

      const rules = notificationManager.getAlertRules()
      await notificationManager.checkSpendingLimits(transactions, rules)

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '⚠️ Limite de gastos atingido!',
        expect.objectContaining({
          body: expect.stringContaining('R$ 250.00'),
        })
      )
    })

    it('should check goal deadlines', async () => {
      const goals = [
        {
          id: 1,
          title: 'Test Goal',
          target_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          status: 'active',
          progress_percentage: 50,
        }
      ]

      await notificationManager.checkGoalDeadlines(goals)

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🎯 Meta precisa de atenção!',
        expect.objectContaining({
          body: expect.stringContaining('Test Goal'),
        })
      )
    })

    it('should check budget status', async () => {
      const budgets = [
        { category: 'Alimentação', amount: 1000 }
      ]

      const transactions = [
        { date: new Date().toISOString().slice(0, 7) + '-15', category: 'Alimentação', type: 'expense', amount: 1200 }
      ]

      await notificationManager.checkBudgetStatus(budgets, transactions)

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🚨 Orçamento excedido!',
        expect.objectContaining({
          body: expect.stringContaining('Alimentação'),
        })
      )
    })

    it('should detect unusual activity', async () => {
      // Create transactions with normal pattern
      const normalTransactions = Array.from({ length: 20 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        type: 'expense',
        amount: 50 + Math.random() * 20, // Normal range: 50-70
      }))

      // Add unusual transaction
      const unusualTransaction = {
        date: new Date().toISOString(),
        type: 'expense',
        amount: 500, // Much higher than normal
      }

      const allTransactions = [...normalTransactions, unusualTransaction]

      await notificationManager.detectUnusualActivity(allTransactions)

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🔍 Atividade incomum detectada',
        expect.objectContaining({
          body: expect.stringContaining('R$ 500.00'),
        })
      )
    })

    it('should celebrate milestone achievement', async () => {
      const goal = { id: 1, title: 'Test Goal' }
      const milestone = { percentage: 50, amount: 5000 }

      await notificationManager.celebrateMilestone(goal, milestone)

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🎉 Parabéns! Marco atingido!',
        expect.objectContaining({
          body: expect.stringContaining('50%'),
        })
      )
    })
  })

  describe('Comprehensive Intelligence Check', () => {
    beforeEach(() => {
      mockNotification.permission = 'granted'
    })

    it('should run all intelligent checks', async () => {
      const data = {
        transactions: [
          { date: new Date().toISOString().split('T')[0], type: 'expense', amount: 250 }
        ],
        goals: [
          {
            id: 1,
            title: 'Test Goal',
            target_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            progress_percentage: 50,
          }
        ],
        budgets: [
          { category: 'Test', amount: 200 }
        ]
      }

      await notificationManager.runIntelligentChecks(data)

      // Should trigger multiple notifications
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledTimes(3)
    })
  })
})
