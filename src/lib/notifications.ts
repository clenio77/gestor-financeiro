// Notification System with Push Notifications and Intelligent Alerts

export interface NotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface AlertRule {
  id: string
  name: string
  type: 'spending_limit' | 'goal_deadline' | 'budget_exceeded' | 'unusual_activity' | 'milestone_achieved'
  conditions: {
    threshold?: number
    timeframe?: 'daily' | 'weekly' | 'monthly'
    category?: string
    account?: string
  }
  enabled: boolean
  channels: ('push' | 'email' | 'in_app')[]
  frequency: 'immediate' | 'daily' | 'weekly'
}

class NotificationManager {
  private static instance: NotificationManager
  private registration: ServiceWorkerRegistration | null = null
  private alertRules: AlertRule[] = []

  private constructor() {
    this.initializeServiceWorker()
    this.loadAlertRules()
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
        console.log('Service Worker ready for notifications')
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  private loadAlertRules() {
    if (typeof window === 'undefined') {
      // Server-side: use default rules
      this.setDefaultRules()
      return
    }

    const saved = localStorage.getItem('financial_alert_rules')
    if (saved) {
      this.alertRules = JSON.parse(saved)
    } else {
      this.setDefaultRules()
    }
  }

  private setDefaultRules() {
    // Default alert rules
    this.alertRules = [
        {
          id: 'spending_limit_daily',
          name: 'Limite de gastos diário',
          type: 'spending_limit',
          conditions: { threshold: 200, timeframe: 'daily' },
          enabled: true,
          channels: ['push', 'in_app'],
          frequency: 'immediate'
        },
        {
          id: 'goal_deadline_warning',
          name: 'Aviso de prazo de meta',
          type: 'goal_deadline',
          conditions: { timeframe: 'weekly' },
          enabled: true,
          channels: ['push', 'in_app'],
          frequency: 'weekly'
        },
        {
          id: 'budget_exceeded',
          name: 'Orçamento excedido',
          type: 'budget_exceeded',
          conditions: { threshold: 100 },
          enabled: true,
          channels: ['push', 'in_app', 'email'],
          frequency: 'immediate'
        }
    ]
    this.saveAlertRules()
  }

  private saveAlertRules() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('financial_alert_rules', JSON.stringify(this.alertRules))
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  async showNotification(data: NotificationData): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    if (this.registration) {
      // Use Service Worker for better notification handling
      const notificationOptions: any = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-72x72.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      }

      // Add actions if supported
      if (data.actions && 'actions' in Notification.prototype) {
        (notificationOptions as any).actions = data.actions
      }

      await this.registration.showNotification(data.title, notificationOptions)
    } else {
      // Fallback to regular notification
      new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
      })
    }
  }

  // Intelligent alert methods
  async checkSpendingLimits(transactions: any[], rules: AlertRule[]) {
    const today = new Date().toISOString().split('T')[0]
    const todayTransactions = transactions.filter(t => 
      t.date.startsWith(today) && t.type === 'expense'
    )
    
    const todayTotal = todayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const spendingRule = rules.find(r => r.type === 'spending_limit' && r.enabled)
    if (spendingRule && todayTotal > (spendingRule.conditions.threshold || 0)) {
      await this.showNotification({
        title: '⚠️ Limite de gastos atingido!',
        body: `Você gastou R$ ${todayTotal.toFixed(2)} hoje. Limite: R$ ${spendingRule.conditions.threshold}`,
        tag: 'spending_limit',
        requireInteraction: true,
        actions: [
          { action: 'view_transactions', title: 'Ver transações' },
          { action: 'adjust_budget', title: 'Ajustar orçamento' }
        ]
      })
    }
  }

  async checkGoalDeadlines(goals: any[]) {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const urgentGoals = goals.filter(goal => {
      if (!goal.target_date || goal.status !== 'active') return false
      const targetDate = new Date(goal.target_date)
      return targetDate <= thirtyDaysFromNow && goal.progress_percentage < 80
    })

    for (const goal of urgentGoals) {
      const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      await this.showNotification({
        title: '🎯 Meta precisa de atenção!',
        body: `"${goal.title}" tem apenas ${daysLeft} dias restantes e está ${goal.progress_percentage.toFixed(1)}% completa.`,
        tag: `goal_deadline_${goal.id}`,
        requireInteraction: true,
        actions: [
          { action: 'contribute_goal', title: 'Contribuir' },
          { action: 'view_goal', title: 'Ver detalhes' }
        ]
      })
    }
  }

  async checkBudgetStatus(budgets: any[], transactions: any[]) {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    
    for (const budget of budgets) {
      const monthlyTransactions = transactions.filter(t => 
        t.date.startsWith(currentMonth) && 
        t.category === budget.category &&
        t.type === 'expense'
      )
      
      const spent = monthlyTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const percentage = (spent / budget.amount) * 100
      
      if (percentage >= 100) {
        await this.showNotification({
          title: '🚨 Orçamento excedido!',
          body: `Categoria "${budget.category}": R$ ${spent.toFixed(2)} / R$ ${budget.amount.toFixed(2)} (${percentage.toFixed(1)}%)`,
          tag: `budget_exceeded_${budget.category}`,
          requireInteraction: true,
          actions: [
            { action: 'view_budget', title: 'Ver orçamento' },
            { action: 'adjust_budget', title: 'Ajustar limite' }
          ]
        })
      } else if (percentage >= 80) {
        await this.showNotification({
          title: '⚠️ Orçamento quase no limite',
          body: `Categoria "${budget.category}": ${percentage.toFixed(1)}% utilizado`,
          tag: `budget_warning_${budget.category}`,
          actions: [
            { action: 'view_budget', title: 'Ver detalhes' }
          ]
        })
      }
    }
  }

  async detectUnusualActivity(transactions: any[]) {
    // Simple anomaly detection based on spending patterns
    const last30Days = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return transactionDate >= thirtyDaysAgo && t.type === 'expense'
    })

    if (last30Days.length < 10) return // Need enough data

    const amounts = last30Days.map(t => Math.abs(t.amount))
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
    const stdDev = Math.sqrt(amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length)

    const recentTransactions = last30Days.slice(-5) // Last 5 transactions
    const unusualTransactions = recentTransactions.filter(t => 
      Math.abs(t.amount) > average + 2 * stdDev
    )

    if (unusualTransactions.length > 0) {
      const largestAmount = Math.max(...unusualTransactions.map(t => Math.abs(t.amount)))
      
      await this.showNotification({
        title: '🔍 Atividade incomum detectada',
        body: `Transação de R$ ${largestAmount.toFixed(2)} está acima do seu padrão normal`,
        tag: 'unusual_activity',
        actions: [
          { action: 'view_transaction', title: 'Ver transação' },
          { action: 'mark_safe', title: 'Marcar como segura' }
        ]
      })
    }
  }

  async celebrateMilestone(goal: any, milestone: any) {
    await this.showNotification({
      title: '🎉 Parabéns! Marco atingido!',
      body: `Você atingiu ${milestone.percentage}% da meta "${goal.title}"!`,
      tag: `milestone_${goal.id}_${milestone.percentage}`,
      requireInteraction: true,
      actions: [
        { action: 'view_goal', title: 'Ver meta' },
        { action: 'share_achievement', title: 'Compartilhar' }
      ]
    })
  }

  // Alert rules management
  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
    const index = this.alertRules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      this.alertRules[index] = { ...this.alertRules[index], ...updates }
      this.saveAlertRules()
    }
  }

  addAlertRule(rule: AlertRule) {
    this.alertRules.push(rule)
    this.saveAlertRules()
  }

  removeAlertRule(ruleId: string) {
    this.alertRules = this.alertRules.filter(r => r.id !== ruleId)
    this.saveAlertRules()
  }

  // Run all intelligent checks
  async runIntelligentChecks(data: {
    transactions: any[]
    goals: any[]
    budgets: any[]
  }) {
    const enabledRules = this.alertRules.filter(r => r.enabled)
    
    await Promise.all([
      this.checkSpendingLimits(data.transactions, enabledRules),
      this.checkGoalDeadlines(data.goals),
      this.checkBudgetStatus(data.budgets, data.transactions),
      this.detectUnusualActivity(data.transactions)
    ])
  }
}

export const notificationManager = NotificationManager.getInstance()
