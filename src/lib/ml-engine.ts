// Machine Learning Engine for Financial Analysis
export interface TransactionPattern {
  category: string
  averageAmount: number
  frequency: number
  dayOfWeek: number[]
  timeOfDay: number[]
  seasonality: number[]
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
}

export interface SpendingPrediction {
  category: string
  predictedAmount: number
  confidence: number
  timeframe: 'daily' | 'weekly' | 'monthly'
  factors: string[]
  recommendation?: string
}

export interface FinancialAnomaly {
  type: 'unusual_amount' | 'unusual_frequency' | 'unusual_category' | 'unusual_timing'
  description: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
  suggestedAction?: string
  relatedTransactions: any[]
}

export interface PersonalizedInsight {
  id: string
  type: 'spending_pattern' | 'saving_opportunity' | 'budget_optimization' | 'goal_suggestion'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  actions?: string[]
  potentialSavings?: number
  confidence: number
}

class MLEngine {
  private static instance: MLEngine
  private patterns: Map<string, TransactionPattern> = new Map()
  private historicalData: any[] = []
  private userProfile: any = {}

  private constructor() {
    this.loadHistoricalData()
  }

  static getInstance(): MLEngine {
    if (!MLEngine.instance) {
      MLEngine.instance = new MLEngine()
    }
    return MLEngine.instance
  }

  private loadHistoricalData(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('ml_historical_data')
      if (stored) {
        this.historicalData = JSON.parse(stored)
      }

      const profile = localStorage.getItem('ml_user_profile')
      if (profile) {
        this.userProfile = JSON.parse(profile)
      }
    } catch (error) {
      console.error('Failed to load ML historical data:', error)
    }
  }

  private saveHistoricalData(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('ml_historical_data', JSON.stringify(this.historicalData))
      localStorage.setItem('ml_user_profile', JSON.stringify(this.userProfile))
    } catch (error) {
      console.error('Failed to save ML historical data:', error)
    }
  }

  // Analyze transaction patterns
  analyzeTransactionPatterns(transactions: any[]): TransactionPattern[] {
    const categoryGroups = this.groupTransactionsByCategory(transactions)
    const patterns: TransactionPattern[] = []

    for (const [category, categoryTransactions] of categoryGroups.entries()) {
      const pattern = this.calculateCategoryPattern(category, categoryTransactions)
      patterns.push(pattern)
      this.patterns.set(category, pattern)
    }

    return patterns
  }

  private groupTransactionsByCategory(transactions: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>()

    transactions.forEach(transaction => {
      const category = transaction.category || 'Outros'
      if (!groups.has(category)) {
        groups.set(category, [])
      }
      groups.get(category)!.push(transaction)
    })

    return groups
  }

  private calculateCategoryPattern(category: string, transactions: any[]): TransactionPattern {
    const amounts = transactions.map(t => Math.abs(t.amount))
    const dates = transactions.map(t => new Date(t.date))
    
    // Calculate average amount
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length

    // Calculate frequency (transactions per month)
    const monthSpan = this.getMonthSpan(dates)
    const frequency = transactions.length / Math.max(monthSpan, 1)

    // Analyze day of week patterns
    const dayOfWeekCounts = new Array(7).fill(0)
    dates.forEach(date => {
      dayOfWeekCounts[date.getDay()]++
    })
    const dayOfWeek = dayOfWeekCounts
      .map((count, day) => ({ day, count }))
      .filter(item => item.count > 0)
      .map(item => item.day)

    // Analyze time of day patterns (simplified)
    const timeOfDay = [9, 12, 18] // Default business hours

    // Calculate seasonality (monthly distribution)
    const monthCounts = new Array(12).fill(0)
    dates.forEach(date => {
      monthCounts[date.getMonth()]++
    })
    const seasonality = monthCounts

    // Calculate trend
    const trend = this.calculateTrend(transactions)

    // Calculate confidence based on data points
    const confidence = Math.min(transactions.length / 10, 1) * 0.8 + 0.2

    return {
      category,
      averageAmount,
      frequency,
      dayOfWeek,
      timeOfDay,
      seasonality,
      trend,
      confidence
    }
  }

  private getMonthSpan(dates: Date[]): number {
    if (dates.length === 0) return 1

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
    const firstDate = sortedDates[0]
    const lastDate = sortedDates[sortedDates.length - 1]
    
    const monthDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                     (lastDate.getMonth() - firstDate.getMonth())
    
    return Math.max(monthDiff, 1)
  }

  private calculateTrend(transactions: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (transactions.length < 3) return 'stable'

    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const firstHalf = sortedTransactions.slice(0, Math.floor(transactions.length / 2))
    const secondHalf = sortedTransactions.slice(Math.floor(transactions.length / 2))

    const firstHalfAvg = firstHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / secondHalf.length

    const changePercent = (secondHalfAvg - firstHalfAvg) / firstHalfAvg

    if (changePercent > 0.1) return 'increasing'
    if (changePercent < -0.1) return 'decreasing'
    return 'stable'
  }

  // Predict future spending
  predictSpending(category: string, timeframe: 'daily' | 'weekly' | 'monthly'): SpendingPrediction | null {
    const pattern = this.patterns.get(category)
    if (!pattern) return null

    let multiplier = 1
    switch (timeframe) {
      case 'daily':
        multiplier = pattern.frequency / 30
        break
      case 'weekly':
        multiplier = pattern.frequency / 4
        break
      case 'monthly':
        multiplier = pattern.frequency
        break
    }

    // Apply trend adjustment
    let trendMultiplier = 1
    if (pattern.trend === 'increasing') trendMultiplier = 1.1
    if (pattern.trend === 'decreasing') trendMultiplier = 0.9

    const predictedAmount = pattern.averageAmount * multiplier * trendMultiplier

    const factors = []
    if (pattern.trend !== 'stable') factors.push(`Tendência ${pattern.trend === 'increasing' ? 'crescente' : 'decrescente'}`)
    if (pattern.frequency > 10) factors.push('Alta frequência de transações')
    if (pattern.confidence > 0.8) factors.push('Padrão bem estabelecido')

    let recommendation = ''
    if (pattern.trend === 'increasing' && predictedAmount > pattern.averageAmount * 1.2) {
      recommendation = `Considere revisar seus gastos em ${category} - tendência de aumento detectada`
    }

    return {
      category,
      predictedAmount,
      confidence: pattern.confidence,
      timeframe,
      factors,
      recommendation: recommendation || undefined
    }
  }

  // Detect anomalies in spending
  detectAnomalies(transactions: any[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = []
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    // Detect unusual amounts
    anomalies.push(...this.detectAmountAnomalies(recentTransactions))
    
    // Detect unusual frequency
    anomalies.push(...this.detectFrequencyAnomalies(recentTransactions))
    
    // Detect unusual categories
    anomalies.push(...this.detectCategoryAnomalies(recentTransactions))
    
    // Detect unusual timing
    anomalies.push(...this.detectTimingAnomalies(recentTransactions))

    return anomalies.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  private detectAmountAnomalies(transactions: any[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = []
    const categoryGroups = this.groupTransactionsByCategory(transactions)

    for (const [category, categoryTransactions] of categoryGroups.entries()) {
      const pattern = this.patterns.get(category)
      if (!pattern) continue

      const unusualTransactions = categoryTransactions.filter(t => {
        const amount = Math.abs(t.amount)
        return amount > pattern.averageAmount * 2 || amount < pattern.averageAmount * 0.3
      })

      if (unusualTransactions.length > 0) {
        const totalUnusual = unusualTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const severity = totalUnusual > pattern.averageAmount * 3 ? 'high' : 
                        totalUnusual > pattern.averageAmount * 1.5 ? 'medium' : 'low'

        anomalies.push({
          type: 'unusual_amount',
          description: `Valores atípicos detectados em ${category}`,
          severity,
          confidence: pattern.confidence,
          suggestedAction: `Revisar transações em ${category} - valores fora do padrão usual`,
          relatedTransactions: unusualTransactions
        })
      }
    }

    return anomalies
  }

  private detectFrequencyAnomalies(transactions: any[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = []
    const categoryGroups = this.groupTransactionsByCategory(transactions)

    for (const [category, categoryTransactions] of categoryGroups.entries()) {
      const pattern = this.patterns.get(category)
      if (!pattern) continue

      const currentFrequency = categoryTransactions.length
      const expectedFrequency = pattern.frequency

      if (currentFrequency > expectedFrequency * 2) {
        anomalies.push({
          type: 'unusual_frequency',
          description: `Frequência alta de gastos em ${category}`,
          severity: currentFrequency > expectedFrequency * 3 ? 'high' : 'medium',
          confidence: pattern.confidence,
          suggestedAction: `Monitorar gastos frequentes em ${category}`,
          relatedTransactions: categoryTransactions
        })
      }
    }

    return anomalies
  }

  private detectCategoryAnomalies(transactions: any[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = []
    const knownCategories = Array.from(this.patterns.keys())
    
    const newCategories = transactions
      .map(t => t.category || 'Outros')
      .filter(category => !knownCategories.includes(category))
      .filter((category, index, arr) => arr.indexOf(category) === index)

    if (newCategories.length > 0) {
      const newCategoryTransactions = transactions.filter(t => 
        newCategories.includes(t.category || 'Outros')
      )

      anomalies.push({
        type: 'unusual_category',
        description: `Novas categorias de gastos detectadas: ${newCategories.join(', ')}`,
        severity: 'medium',
        confidence: 0.7,
        suggestedAction: 'Revisar e categorizar adequadamente os novos tipos de gastos',
        relatedTransactions: newCategoryTransactions
      })
    }

    return anomalies
  }

  private detectTimingAnomalies(transactions: any[]): FinancialAnomaly[] {
    const anomalies: FinancialAnomaly[] = []
    
    // Detect weekend spending spikes
    const weekendTransactions = transactions.filter(t => {
      const day = new Date(t.date).getDay()
      return day === 0 || day === 6
    })

    if (weekendTransactions.length > transactions.length * 0.4) {
      const weekendAmount = weekendTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

      if (weekendAmount > totalAmount * 0.5) {
        anomalies.push({
          type: 'unusual_timing',
          description: 'Alto volume de gastos nos fins de semana',
          severity: 'medium',
          confidence: 0.8,
          suggestedAction: 'Considerar estratégias para controlar gastos de fim de semana',
          relatedTransactions: weekendTransactions
        })
      }
    }

    return anomalies
  }

  // Generate personalized insights
  generateInsights(transactions: any[], goals: any[], budgets: any[]): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = []

    // Spending pattern insights
    insights.push(...this.generateSpendingInsights(transactions))
    
    // Saving opportunity insights
    insights.push(...this.generateSavingInsights(transactions, budgets))
    
    // Budget optimization insights
    insights.push(...this.generateBudgetInsights(transactions, budgets))
    
    // Goal suggestion insights
    insights.push(...this.generateGoalInsights(transactions, goals))

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    })
  }

  private generateSpendingInsights(transactions: any[]): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = []
    const patterns = this.analyzeTransactionPatterns(transactions)

    // Find categories with increasing trends
    const increasingCategories = patterns.filter(p => p.trend === 'increasing' && p.confidence > 0.6)
    
    if (increasingCategories.length > 0) {
      const topIncreasing = increasingCategories.sort((a, b) => b.averageAmount - a.averageAmount)[0]
      
      insights.push({
        id: `spending_trend_${topIncreasing.category}`,
        type: 'spending_pattern',
        title: `Gastos crescentes em ${topIncreasing.category}`,
        description: `Seus gastos em ${topIncreasing.category} aumentaram significativamente. Média atual: R$ ${topIncreasing.averageAmount.toFixed(2)}`,
        impact: topIncreasing.averageAmount > 500 ? 'high' : 'medium',
        actionable: true,
        actions: [
          `Revisar gastos em ${topIncreasing.category}`,
          'Definir limite mensal para esta categoria',
          'Buscar alternativas mais econômicas'
        ],
        confidence: topIncreasing.confidence
      })
    }

    return insights
  }

  private generateSavingInsights(transactions: any[], budgets: any[]): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = []
    
    // Find categories where user consistently spends less than budget
    const underBudgetCategories = budgets.filter(budget => {
      const categoryTransactions = transactions.filter(t => t.category === budget.category)
      const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      return totalSpent < budget.amount * 0.8
    })

    if (underBudgetCategories.length > 0) {
      const totalPotentialSavings = underBudgetCategories.reduce((sum, budget) => {
        const categoryTransactions = transactions.filter(t => t.category === budget.category)
        const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        return sum + (budget.amount - totalSpent)
      }, 0)

      insights.push({
        id: 'budget_optimization_savings',
        type: 'saving_opportunity',
        title: 'Oportunidade de otimização de orçamento',
        description: `Você tem gastado consistentemente menos que o orçado em algumas categorias. Potencial de realocação: R$ ${totalPotentialSavings.toFixed(2)}`,
        impact: totalPotentialSavings > 200 ? 'high' : 'medium',
        actionable: true,
        actions: [
          'Realocar orçamento para categorias com maior necessidade',
          'Aumentar contribuição para metas de economia',
          'Criar reserva de emergência'
        ],
        potentialSavings: totalPotentialSavings,
        confidence: 0.8
      })
    }

    return insights
  }

  private generateBudgetInsights(transactions: any[], budgets: any[]): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = []
    
    // Analyze budget performance
    const budgetPerformance = budgets.map(budget => {
      const categoryTransactions = transactions.filter(t => t.category === budget.category)
      const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const utilizationRate = totalSpent / budget.amount
      
      return { ...budget, totalSpent, utilizationRate }
    })

    // Find consistently over-budget categories
    const overBudgetCategories = budgetPerformance.filter(bp => bp.utilizationRate > 1.1)
    
    if (overBudgetCategories.length > 0) {
      const worstCategory = overBudgetCategories.sort((a, b) => b.utilizationRate - a.utilizationRate)[0]
      
      insights.push({
        id: `budget_exceeded_${worstCategory.category}`,
        type: 'budget_optimization',
        title: `Orçamento excedido em ${worstCategory.category}`,
        description: `Você gastou ${((worstCategory.utilizationRate - 1) * 100).toFixed(1)}% a mais que o orçado em ${worstCategory.category}`,
        impact: worstCategory.utilizationRate > 1.5 ? 'high' : 'medium',
        actionable: true,
        actions: [
          `Aumentar orçamento para ${worstCategory.category}`,
          'Identificar gastos desnecessários nesta categoria',
          'Estabelecer alertas de limite de gastos'
        ],
        confidence: 0.9
      })
    }

    return insights
  }

  private generateGoalInsights(transactions: any[], goals: any[]): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = []
    
    // Analyze saving capacity based on spending patterns
    const monthlyIncome = this.estimateMonthlyIncome(transactions)
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions)
    const savingCapacity = monthlyIncome - monthlyExpenses

    if (savingCapacity > 0 && goals.length === 0) {
      insights.push({
        id: 'suggest_savings_goal',
        type: 'goal_suggestion',
        title: 'Oportunidade para criar meta de economia',
        description: `Com base no seu padrão de gastos, você pode economizar aproximadamente R$ ${savingCapacity.toFixed(2)} por mês`,
        impact: savingCapacity > 500 ? 'high' : 'medium',
        actionable: true,
        actions: [
          'Criar meta de reserva de emergência',
          'Definir objetivo de investimento',
          'Estabelecer meta para compra específica'
        ],
        potentialSavings: savingCapacity,
        confidence: 0.7
      })
    }

    return insights
  }

  private estimateMonthlyIncome(transactions: any[]): number {
    const incomeTransactions = transactions.filter(t => t.amount > 0 && t.type === 'income')
    if (incomeTransactions.length === 0) return 0

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const monthSpan = this.getMonthSpan(incomeTransactions.map(t => new Date(t.date)))
    
    return totalIncome / Math.max(monthSpan, 1)
  }

  private calculateMonthlyExpenses(transactions: any[]): number {
    const expenseTransactions = transactions.filter(t => t.amount < 0 || t.type === 'expense')
    if (expenseTransactions.length === 0) return 0

    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const monthSpan = this.getMonthSpan(expenseTransactions.map(t => new Date(t.date)))
    
    return totalExpenses / Math.max(monthSpan, 1)
  }

  // Update user profile for better predictions
  updateUserProfile(profile: any): void {
    this.userProfile = { ...this.userProfile, ...profile }
    this.saveHistoricalData()
  }

  // Get ML engine status and statistics
  getEngineStatus(): {
    patternsAnalyzed: number
    dataPoints: number
    confidenceLevel: number
    lastUpdate: Date
  } {
    const patterns = Array.from(this.patterns.values())
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0

    return {
      patternsAnalyzed: patterns.length,
      dataPoints: this.historicalData.length,
      confidenceLevel: avgConfidence,
      lastUpdate: new Date()
    }
  }
}

// Export singleton instance
export const mlEngine = MLEngine.getInstance()
