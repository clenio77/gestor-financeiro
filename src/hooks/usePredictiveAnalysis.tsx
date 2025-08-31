'use client'

import { useState, useEffect, useCallback } from 'react'
import { mlEngine, PersonalizedInsight, FinancialAnomaly, SpendingPrediction } from '@/lib/ml-engine'

export interface PredictiveAnalysisData {
  insights: PersonalizedInsight[]
  anomalies: FinancialAnomaly[]
  predictions: SpendingPrediction[]
  cashFlowForecast: CashFlowForecast
  savingsOpportunities: SavingsOpportunity[]
  riskAssessment: RiskAssessment
}

export interface CashFlowForecast {
  nextMonth: {
    predictedIncome: number
    predictedExpenses: number
    netCashFlow: number
    confidence: number
  }
  next3Months: {
    predictedIncome: number
    predictedExpenses: number
    netCashFlow: number
    confidence: number
  }
  trends: {
    incomeGrowth: number
    expenseGrowth: number
    savingsRate: number
  }
}

export interface SavingsOpportunity {
  id: string
  category: string
  currentSpending: number
  optimizedSpending: number
  potentialSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
  impact: 'low' | 'medium' | 'high'
  suggestions: string[]
  confidence: number
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high'
  riskFactors: {
    type: 'spending_volatility' | 'income_instability' | 'emergency_fund' | 'debt_ratio'
    description: string
    severity: 'low' | 'medium' | 'high'
    recommendation: string
  }[]
  emergencyFundRecommendation: number
  debtToIncomeRatio: number
  spendingVolatility: number
}

export function usePredictiveAnalysis(
  transactions: any[] = [],
  goals: any[] = [],
  budgets: any[] = [],
  accounts: any[] = []
) {
  const [analysisData, setAnalysisData] = useState<PredictiveAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)

  const runAnalysis = useCallback(async () => {
    if (transactions.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // Generate basic ML insights
      const insights = mlEngine.generateInsights(transactions, goals, budgets)
      const anomalies = mlEngine.detectAnomalies(transactions)
      
      // Generate predictions for main categories
      const patterns = mlEngine.analyzeTransactionPatterns(transactions)
      const predictions: SpendingPrediction[] = []
      
      patterns.slice(0, 8).forEach(pattern => {
        const prediction = mlEngine.predictSpending(pattern.category, 'monthly')
        if (prediction) {
          predictions.push(prediction)
        }
      })

      // Generate cash flow forecast
      const cashFlowForecast = generateCashFlowForecast(transactions)
      
      // Find savings opportunities
      const savingsOpportunities = findSavingsOpportunities(transactions, budgets, patterns)
      
      // Assess financial risks
      const riskAssessment = assessFinancialRisks(transactions, accounts)

      const newAnalysisData: PredictiveAnalysisData = {
        insights,
        anomalies,
        predictions,
        cashFlowForecast,
        savingsOpportunities,
        riskAssessment
      }

      setAnalysisData(newAnalysisData)
      setLastAnalysis(new Date())

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na análise preditiva')
      console.error('Predictive analysis error:', err)
    } finally {
      setLoading(false)
    }
  }, [transactions, goals, budgets, accounts])

  // Auto-run analysis when data changes
  useEffect(() => {
    const shouldRunAnalysis = 
      transactions.length > 0 && 
      (!lastAnalysis || Date.now() - lastAnalysis.getTime() > 5 * 60 * 1000) // 5 minutes

    if (shouldRunAnalysis) {
      runAnalysis()
    }
  }, [transactions, goals, budgets, accounts, runAnalysis, lastAnalysis])

  const generateCashFlowForecast = (transactions: any[]): CashFlowForecast => {
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    
    const recentTransactions = transactions.filter(t => new Date(t.date) >= threeMonthsAgo)
    
    // Calculate monthly averages
    const monthlyIncome = calculateMonthlyAverage(recentTransactions.filter(t => t.amount > 0))
    const monthlyExpenses = calculateMonthlyAverage(recentTransactions.filter(t => t.amount < 0))
    
    // Calculate trends
    const incomeGrowth = calculateGrowthTrend(recentTransactions.filter(t => t.amount > 0))
    const expenseGrowth = calculateGrowthTrend(recentTransactions.filter(t => t.amount < 0))
    
    // Next month predictions
    const nextMonthIncome = monthlyIncome * (1 + incomeGrowth)
    const nextMonthExpenses = Math.abs(monthlyExpenses) * (1 + expenseGrowth)
    
    // Next 3 months predictions
    const next3MonthsIncome = nextMonthIncome * 3 * (1 + incomeGrowth * 0.5)
    const next3MonthsExpenses = nextMonthExpenses * 3 * (1 + expenseGrowth * 0.5)
    
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - Math.abs(monthlyExpenses)) / monthlyIncome : 0

    return {
      nextMonth: {
        predictedIncome: nextMonthIncome,
        predictedExpenses: nextMonthExpenses,
        netCashFlow: nextMonthIncome - nextMonthExpenses,
        confidence: recentTransactions.length > 30 ? 0.8 : 0.6
      },
      next3Months: {
        predictedIncome: next3MonthsIncome,
        predictedExpenses: next3MonthsExpenses,
        netCashFlow: next3MonthsIncome - next3MonthsExpenses,
        confidence: recentTransactions.length > 50 ? 0.7 : 0.5
      },
      trends: {
        incomeGrowth,
        expenseGrowth,
        savingsRate
      }
    }
  }

  const calculateMonthlyAverage = (transactions: any[]): number => {
    if (transactions.length === 0) return 0
    
    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const months = getMonthSpan(transactions.map(t => new Date(t.date)))
    
    return total / Math.max(months, 1)
  }

  const calculateGrowthTrend = (transactions: any[]): number => {
    if (transactions.length < 6) return 0
    
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    const firstHalf = sortedTransactions.slice(0, Math.floor(transactions.length / 2))
    const secondHalf = sortedTransactions.slice(Math.floor(transactions.length / 2))
    
    const firstHalfAvg = firstHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / secondHalf.length
    
    return firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0
  }

  const getMonthSpan = (dates: Date[]): number => {
    if (dates.length === 0) return 1
    
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
    const firstDate = sortedDates[0]
    const lastDate = sortedDates[sortedDates.length - 1]
    
    const monthDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                     (lastDate.getMonth() - firstDate.getMonth())
    
    return Math.max(monthDiff, 1)
  }

  const findSavingsOpportunities = (
    transactions: any[], 
    budgets: any[], 
    patterns: any[]
  ): SavingsOpportunity[] => {
    const opportunities: SavingsOpportunity[] = []
    
    // Analyze each category for optimization potential
    patterns.forEach(pattern => {
      const categoryTransactions = transactions.filter(t => t.category === pattern.category)
      const currentSpending = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      // Find optimization potential based on spending patterns
      let optimizationPotential = 0
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
      let suggestions: string[] = []
      
      // High-frequency, low-value transactions (easy to optimize)
      const smallTransactions = categoryTransactions.filter(t => Math.abs(t.amount) < pattern.averageAmount * 0.5)
      if (smallTransactions.length > pattern.frequency * 0.3) {
        optimizationPotential = smallTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) * 0.3
        difficulty = 'easy'
        suggestions.push('Reduzir pequenos gastos frequentes')
        suggestions.push('Considerar alternativas mais econômicas')
      }
      
      // Weekend/impulse spending
      const weekendTransactions = categoryTransactions.filter(t => {
        const day = new Date(t.date).getDay()
        return day === 0 || day === 6
      })
      if (weekendTransactions.length > categoryTransactions.length * 0.4) {
        optimizationPotential += weekendTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) * 0.2
        suggestions.push('Planejar gastos de fim de semana')
        suggestions.push('Estabelecer limite para gastos de lazer')
      }
      
      // Above-budget categories
      const budget = budgets.find(b => b.category === pattern.category)
      if (budget && currentSpending > budget.amount) {
        optimizationPotential += (currentSpending - budget.amount) * 0.5
        difficulty = 'hard'
        suggestions.push('Revisar orçamento da categoria')
        suggestions.push('Identificar gastos desnecessários')
      }
      
      if (optimizationPotential > 50) { // Only suggest if savings > R$ 50
        const potentialSavings = Math.min(optimizationPotential, currentSpending * 0.3)
        const optimizedSpending = currentSpending - potentialSavings
        
        opportunities.push({
          id: `savings_${pattern.category}`,
          category: pattern.category,
          currentSpending,
          optimizedSpending,
          potentialSavings,
          difficulty,
          impact: potentialSavings > 200 ? 'high' : potentialSavings > 100 ? 'medium' : 'low',
          suggestions,
          confidence: pattern.confidence
        })
      }
    })
    
    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }

  const assessFinancialRisks = (transactions: any[], accounts: any[]): RiskAssessment => {
    const riskFactors: RiskAssessment['riskFactors'] = []
    
    // Calculate spending volatility
    const monthlyExpenses = getMonthlyExpenses(transactions)
    const spendingVolatility = calculateVolatility(monthlyExpenses)
    
    if (spendingVolatility > 0.3) {
      riskFactors.push({
        type: 'spending_volatility',
        description: 'Gastos mensais muito variáveis',
        severity: spendingVolatility > 0.5 ? 'high' : 'medium',
        recommendation: 'Criar orçamento mais estruturado e reserva para gastos variáveis'
      })
    }
    
    // Calculate income stability
    const monthlyIncome = getMonthlyIncome(transactions)
    const incomeVolatility = calculateVolatility(monthlyIncome)
    
    if (incomeVolatility > 0.2) {
      riskFactors.push({
        type: 'income_instability',
        description: 'Renda mensal instável',
        severity: incomeVolatility > 0.4 ? 'high' : 'medium',
        recommendation: 'Diversificar fontes de renda e aumentar reserva de emergência'
      })
    }
    
    // Emergency fund assessment
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    const avgMonthlyExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp, 0) / monthlyExpenses.length
    const emergencyFundMonths = totalBalance / avgMonthlyExpenses
    
    if (emergencyFundMonths < 3) {
      riskFactors.push({
        type: 'emergency_fund',
        description: 'Reserva de emergência insuficiente',
        severity: emergencyFundMonths < 1 ? 'high' : 'medium',
        recommendation: 'Construir reserva equivalente a 3-6 meses de gastos'
      })
    }
    
    // Debt-to-income ratio (simplified)
    const avgMonthlyIncome = monthlyIncome.reduce((sum, inc) => sum + inc, 0) / monthlyIncome.length
    const debtToIncomeRatio = avgMonthlyExpenses / avgMonthlyIncome
    
    if (debtToIncomeRatio > 0.8) {
      riskFactors.push({
        type: 'debt_ratio',
        description: 'Alto comprometimento da renda',
        severity: debtToIncomeRatio > 0.9 ? 'high' : 'medium',
        recommendation: 'Reduzir gastos fixos e aumentar renda'
      })
    }
    
    // Overall risk assessment
    const highRiskFactors = riskFactors.filter(rf => rf.severity === 'high').length
    const mediumRiskFactors = riskFactors.filter(rf => rf.severity === 'medium').length
    
    let overallRisk: 'low' | 'medium' | 'high' = 'low'
    if (highRiskFactors > 0 || mediumRiskFactors > 2) overallRisk = 'high'
    else if (mediumRiskFactors > 0) overallRisk = 'medium'
    
    return {
      overallRisk,
      riskFactors,
      emergencyFundRecommendation: avgMonthlyExpenses * 6,
      debtToIncomeRatio,
      spendingVolatility
    }
  }

  const getMonthlyExpenses = (transactions: any[]): number[] => {
    const expensesByMonth = new Map<string, number>()
    
    transactions.filter(t => t.amount < 0).forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const current = expensesByMonth.get(monthKey) || 0
      expensesByMonth.set(monthKey, current + Math.abs(transaction.amount))
    })
    
    return Array.from(expensesByMonth.values())
  }

  const getMonthlyIncome = (transactions: any[]): number[] => {
    const incomeByMonth = new Map<string, number>()
    
    transactions.filter(t => t.amount > 0).forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const current = incomeByMonth.get(monthKey) || 0
      incomeByMonth.set(monthKey, current + transaction.amount)
    })
    
    return Array.from(incomeByMonth.values())
  }

  const calculateVolatility = (values: number[]): number => {
    if (values.length < 2) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const standardDeviation = Math.sqrt(variance)
    
    return mean > 0 ? standardDeviation / mean : 0
  }

  return {
    analysisData,
    loading,
    error,
    lastAnalysis,
    runAnalysis,
    // Helper functions for components
    getCashFlowTrend: () => analysisData?.cashFlowForecast.trends,
    getTopSavingsOpportunities: (limit = 3) => 
      analysisData?.savingsOpportunities.slice(0, limit) || [],
    getRiskLevel: () => analysisData?.riskAssessment.overallRisk || 'low',
    getHighPriorityInsights: () => 
      analysisData?.insights.filter(i => i.impact === 'high') || [],
    getCriticalAnomalies: () => 
      analysisData?.anomalies.filter(a => a.severity === 'high') || []
  }
}
