// Advanced Predictive Analytics System
import { formatDate, addMonths, differenceInMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface PredictionModel {
  id: string
  name: string
  type: 'linear_regression' | 'moving_average' | 'seasonal' | 'ml_ensemble'
  accuracy: number
  lastTrained: Date
  parameters: ModelParameters
}

export interface ModelParameters {
  lookbackPeriod: number
  seasonalityFactor: number
  trendWeight: number
  volatilityAdjustment: number
  confidenceInterval: number
}

export interface Prediction {
  id: string
  type: 'income' | 'expense' | 'savings' | 'goal_completion' | 'market_trend'
  category?: string
  value: number
  confidence: number
  timeframe: 'next_month' | 'next_quarter' | 'next_year' | 'custom'
  targetDate: Date
  factors: PredictionFactor[]
  scenarios: PredictionScenario[]
  recommendations: string[]
  createdAt: Date
}

export interface PredictionFactor {
  name: string
  impact: number
  description: string
  confidence: number
}

export interface PredictionScenario {
  name: 'optimistic' | 'realistic' | 'pessimistic'
  probability: number
  value: number
  description: string
  keyAssumptions: string[]
}

export interface MarketTrend {
  id: string
  indicator: 'selic' | 'inflation' | 'stock_market' | 'real_estate' | 'unemployment'
  currentValue: number
  predictedValue: number
  trend: 'up' | 'down' | 'stable'
  confidence: number
  impact: 'positive' | 'negative' | 'neutral'
  personalRelevance: number
  description: string
  source: string
  updatedAt: Date
}

export interface FinancialForecast {
  id: string
  userId: string
  period: 'monthly' | 'quarterly' | 'yearly'
  startDate: Date
  endDate: Date
  projections: ForecastProjection[]
  assumptions: ForecastAssumption[]
  riskFactors: RiskFactor[]
  confidence: number
  generatedAt: Date
}

export interface ForecastProjection {
  date: Date
  income: {
    predicted: number
    confidence: number
    breakdown: { [category: string]: number }
  }
  expenses: {
    predicted: number
    confidence: number
    breakdown: { [category: string]: number }
  }
  savings: {
    predicted: number
    confidence: number
  }
  netWorth: {
    predicted: number
    confidence: number
  }
  goalProgress: { [goalId: string]: number }
}

export interface ForecastAssumption {
  parameter: string
  currentValue: number
  assumedGrowthRate: number
  rationale: string
  sensitivity: 'low' | 'medium' | 'high'
}

export interface RiskFactor {
  name: string
  probability: number
  impact: number
  description: string
  mitigation: string[]
}

export interface InvestmentRecommendation {
  id: string
  type: 'stocks' | 'bonds' | 'real_estate' | 'crypto' | 'commodities' | 'mixed'
  name: string
  description: string
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  timeHorizon: 'short' | 'medium' | 'long'
  minimumInvestment: number
  liquidity: 'high' | 'medium' | 'low'
  reasoning: string
  pros: string[]
  cons: string[]
  marketConditions: string
  personalFit: number
  confidence: number
  createdAt: Date
}

class PredictiveAnalytics {
  private static instance: PredictiveAnalytics
  private models: Map<string, PredictionModel> = new Map()
  private predictions: Prediction[] = []
  private marketTrends: MarketTrend[] = []
  private forecasts: FinancialForecast[] = []

  private constructor() {
    this.initializeModels()
    this.loadMarketData()
  }

  static getInstance(): PredictiveAnalytics {
    if (!PredictiveAnalytics.instance) {
      PredictiveAnalytics.instance = new PredictiveAnalytics()
    }
    return PredictiveAnalytics.instance
  }

  private initializeModels(): void {
    // Linear Regression Model
    const linearModel: PredictionModel = {
      id: 'linear_regression',
      name: 'Regressão Linear',
      type: 'linear_regression',
      accuracy: 0.75,
      lastTrained: new Date(),
      parameters: {
        lookbackPeriod: 12,
        seasonalityFactor: 0.1,
        trendWeight: 0.8,
        volatilityAdjustment: 0.2,
        confidenceInterval: 0.95
      }
    }

    // Moving Average Model
    const movingAvgModel: PredictionModel = {
      id: 'moving_average',
      name: 'Média Móvel',
      type: 'moving_average',
      accuracy: 0.65,
      lastTrained: new Date(),
      parameters: {
        lookbackPeriod: 6,
        seasonalityFactor: 0.15,
        trendWeight: 0.6,
        volatilityAdjustment: 0.3,
        confidenceInterval: 0.90
      }
    }

    // Seasonal Model
    const seasonalModel: PredictionModel = {
      id: 'seasonal',
      name: 'Análise Sazonal',
      type: 'seasonal',
      accuracy: 0.80,
      lastTrained: new Date(),
      parameters: {
        lookbackPeriod: 24,
        seasonalityFactor: 0.4,
        trendWeight: 0.5,
        volatilityAdjustment: 0.1,
        confidenceInterval: 0.85
      }
    }

    this.models.set('linear_regression', linearModel)
    this.models.set('moving_average', movingAvgModel)
    this.models.set('seasonal', seasonalModel)
  }

  private loadMarketData(): void {
    // Simulate market trends - in production, fetch from financial APIs
    this.marketTrends = [
      {
        id: 'selic_trend',
        indicator: 'selic',
        currentValue: 13.75,
        predictedValue: 12.50,
        trend: 'down',
        confidence: 0.75,
        impact: 'positive',
        personalRelevance: 0.9,
        description: 'Taxa Selic deve cair nos próximos meses',
        source: 'Banco Central',
        updatedAt: new Date()
      },
      {
        id: 'inflation_trend',
        indicator: 'inflation',
        currentValue: 4.62,
        predictedValue: 3.80,
        trend: 'down',
        confidence: 0.65,
        impact: 'positive',
        personalRelevance: 0.85,
        description: 'Inflação em trajetória de queda',
        source: 'IBGE',
        updatedAt: new Date()
      },
      {
        id: 'stock_market_trend',
        indicator: 'stock_market',
        currentValue: 125000,
        predictedValue: 135000,
        trend: 'up',
        confidence: 0.60,
        impact: 'positive',
        personalRelevance: 0.70,
        description: 'Ibovespa com tendência de alta',
        source: 'B3',
        updatedAt: new Date()
      }
    ]
  }

  // Main prediction methods
  async predictIncome(historicalData: any[], timeframe: string = 'next_month'): Promise<Prediction> {
    const model = this.models.get('seasonal')!
    const prediction = this.calculateLinearTrend(historicalData, 'income')
    
    const factors: PredictionFactor[] = [
      {
        name: 'Tendência Histórica',
        impact: 0.6,
        description: 'Baseado no padrão dos últimos 12 meses',
        confidence: 0.8
      },
      {
        name: 'Sazonalidade',
        impact: 0.3,
        description: 'Variações sazonais típicas',
        confidence: 0.7
      },
      {
        name: 'Condições Econômicas',
        impact: 0.1,
        description: 'Cenário macroeconômico atual',
        confidence: 0.6
      }
    ]

    const scenarios: PredictionScenario[] = [
      {
        name: 'optimistic',
        probability: 0.25,
        value: prediction.value * 1.15,
        description: 'Cenário com crescimento acima da média',
        keyAssumptions: ['Economia em crescimento', 'Oportunidades de renda extra']
      },
      {
        name: 'realistic',
        probability: 0.50,
        value: prediction.value,
        description: 'Cenário mais provável baseado em tendências',
        keyAssumptions: ['Manutenção do padrão atual', 'Estabilidade econômica']
      },
      {
        name: 'pessimistic',
        probability: 0.25,
        value: prediction.value * 0.85,
        description: 'Cenário com redução de renda',
        keyAssumptions: ['Instabilidade econômica', 'Redução de oportunidades']
      }
    ]

    return {
      id: this.generateId(),
      type: 'income',
      value: prediction.value,
      confidence: prediction.confidence,
      timeframe: timeframe as any,
      targetDate: this.getTargetDate(timeframe),
      factors,
      scenarios,
      recommendations: this.generateIncomeRecommendations(prediction, scenarios),
      createdAt: new Date()
    }
  }

  async predictExpenses(historicalData: any[], category?: string, timeframe: string = 'next_month'): Promise<Prediction> {
    const model = this.models.get('moving_average')!
    const prediction = this.calculateMovingAverage(historicalData, 'expense', category)
    
    const factors: PredictionFactor[] = [
      {
        name: 'Padrão de Gastos',
        impact: 0.7,
        description: 'Baseado no histórico de gastos recentes',
        confidence: 0.85
      },
      {
        name: 'Inflação',
        impact: 0.2,
        description: 'Impacto da inflação nos preços',
        confidence: 0.75
      },
      {
        name: 'Mudanças de Hábito',
        impact: 0.1,
        description: 'Alterações no comportamento de consumo',
        confidence: 0.6
      }
    ]

    const scenarios: PredictionScenario[] = [
      {
        name: 'optimistic',
        probability: 0.30,
        value: prediction.value * 0.90,
        description: 'Redução de gastos através de economia',
        keyAssumptions: ['Controle rigoroso de gastos', 'Inflação controlada']
      },
      {
        name: 'realistic',
        probability: 0.50,
        value: prediction.value,
        description: 'Manutenção do padrão atual de gastos',
        keyAssumptions: ['Comportamento estável', 'Inflação moderada']
      },
      {
        name: 'pessimistic',
        probability: 0.20,
        value: prediction.value * 1.20,
        description: 'Aumento de gastos por fatores externos',
        keyAssumptions: ['Alta inflação', 'Gastos emergenciais']
      }
    ]

    return {
      id: this.generateId(),
      type: 'expense',
      category,
      value: prediction.value,
      confidence: prediction.confidence,
      timeframe: timeframe as any,
      targetDate: this.getTargetDate(timeframe),
      factors,
      scenarios,
      recommendations: this.generateExpenseRecommendations(prediction, scenarios),
      createdAt: new Date()
    }
  }

  async predictGoalCompletion(goal: any, currentSavingsRate: number): Promise<Prediction> {
    const remainingAmount = goal.targetAmount - goal.currentAmount
    const monthlyContribution = currentSavingsRate * 0.3 // Assume 30% of savings go to this goal
    const monthsToComplete = remainingAmount / monthlyContribution
    
    const targetDate = addMonths(new Date(), Math.ceil(monthsToComplete))
    const confidence = this.calculateGoalConfidence(goal, currentSavingsRate)

    const factors: PredictionFactor[] = [
      {
        name: 'Taxa de Poupança Atual',
        impact: 0.6,
        description: 'Capacidade atual de poupar mensalmente',
        confidence: 0.8
      },
      {
        name: 'Prioridade da Meta',
        impact: 0.3,
        description: 'Importância relativa desta meta',
        confidence: 0.7
      },
      {
        name: 'Estabilidade Financeira',
        impact: 0.1,
        description: 'Previsibilidade da situação financeira',
        confidence: 0.6
      }
    ]

    const scenarios: PredictionScenario[] = [
      {
        name: 'optimistic',
        probability: 0.25,
        value: monthsToComplete * 0.8,
        description: 'Conclusão mais rápida com esforço extra',
        keyAssumptions: ['Aumento da renda', 'Redução de gastos', 'Foco na meta']
      },
      {
        name: 'realistic',
        probability: 0.50,
        value: monthsToComplete,
        description: 'Conclusão no prazo estimado',
        keyAssumptions: ['Manutenção do ritmo atual', 'Sem grandes mudanças']
      },
      {
        name: 'pessimistic',
        probability: 0.25,
        value: monthsToComplete * 1.5,
        description: 'Atraso devido a imprevistos',
        keyAssumptions: ['Gastos emergenciais', 'Redução da renda', 'Outras prioridades']
      }
    ]

    return {
      id: this.generateId(),
      type: 'goal_completion',
      value: monthsToComplete,
      confidence,
      timeframe: 'custom',
      targetDate,
      factors,
      scenarios,
      recommendations: this.generateGoalRecommendations(goal, monthsToComplete, scenarios),
      createdAt: new Date()
    }
  }

  // Calculation methods
  private calculateLinearTrend(data: any[], type: string): { value: number; confidence: number } {
    if (data.length < 2) return { value: 0, confidence: 0.1 }

    const values = data
      .filter(d => d.type === type)
      .map(d => d.amount)
      .slice(-12) // Last 12 months

    if (values.length === 0) return { value: 0, confidence: 0.1 }

    // Simple linear regression
    const n = values.length
    const sumX = (n * (n + 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + val * (i + 1), 0)
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const nextValue = slope * (n + 1) + intercept
    const confidence = Math.min(0.9, Math.max(0.3, 1 - (this.calculateVariance(values) / Math.abs(nextValue))))

    return {
      value: Math.max(0, nextValue),
      confidence
    }
  }

  private calculateMovingAverage(data: any[], type: string, category?: string): { value: number; confidence: number } {
    let filteredData = data.filter(d => d.type === type)
    
    if (category) {
      filteredData = filteredData.filter(d => d.category === category)
    }

    const values = filteredData
      .map(d => Math.abs(d.amount))
      .slice(-6) // Last 6 months

    if (values.length === 0) return { value: 0, confidence: 0.1 }

    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = this.calculateVariance(values)
    const confidence = Math.min(0.85, Math.max(0.4, 1 - (variance / average)))

    return {
      value: average,
      confidence
    }
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  }

  private calculateGoalConfidence(goal: any, savingsRate: number): number {
    const progressRate = goal.currentAmount / goal.targetAmount
    const timeRemaining = differenceInMonths(new Date(goal.targetDate), new Date())
    const requiredMonthlySavings = (goal.targetAmount - goal.currentAmount) / Math.max(1, timeRemaining)
    const availableSavings = savingsRate * 0.3 // Assume 30% allocation

    let confidence = 0.5

    // Adjust based on progress
    if (progressRate > 0.5) confidence += 0.2
    else if (progressRate < 0.1) confidence -= 0.2

    // Adjust based on feasibility
    if (availableSavings >= requiredMonthlySavings) confidence += 0.3
    else confidence -= (requiredMonthlySavings - availableSavings) / requiredMonthlySavings * 0.4

    // Adjust based on time horizon
    if (timeRemaining > 12) confidence += 0.1
    else if (timeRemaining < 3) confidence -= 0.2

    return Math.min(0.95, Math.max(0.1, confidence))
  }

  // Recommendation generators
  private generateIncomeRecommendations(prediction: any, scenarios: PredictionScenario[]): string[] {
    const recommendations: string[] = []

    if (prediction.confidence < 0.6) {
      recommendations.push("Diversifique suas fontes de renda para maior previsibilidade")
    }

    const pessimisticScenario = scenarios.find(s => s.name === 'pessimistic')
    if (pessimisticScenario && pessimisticScenario.probability > 0.3) {
      recommendations.push("Considere criar uma reserva adicional para períodos de menor renda")
    }

    recommendations.push("Monitore oportunidades de renda extra ou promoções no trabalho")
    
    return recommendations
  }

  private generateExpenseRecommendations(prediction: any, scenarios: PredictionScenario[]): string[] {
    const recommendations: string[] = []

    const pessimisticScenario = scenarios.find(s => s.name === 'pessimistic')
    if (pessimisticScenario && pessimisticScenario.value > prediction.value * 1.1) {
      recommendations.push("Revise seu orçamento para identificar gastos que podem ser reduzidos")
    }

    recommendations.push("Considere automatizar suas economias para evitar gastos desnecessários")
    recommendations.push("Monitore a inflação e ajuste seu orçamento conforme necessário")

    return recommendations
  }

  private generateGoalRecommendations(goal: any, monthsToComplete: number, scenarios: PredictionScenario[]): string[] {
    const recommendations: string[] = []

    if (monthsToComplete > 24) {
      recommendations.push("Considere aumentar sua contribuição mensal para esta meta")
      recommendations.push("Avalie se o valor da meta está realista para seu perfil financeiro")
    }

    const optimisticScenario = scenarios.find(s => s.name === 'optimistic')
    if (optimisticScenario) {
      recommendations.push("Identifique oportunidades de renda extra para acelerar o progresso")
    }

    recommendations.push("Automatize as transferências para esta meta para garantir consistência")

    return recommendations
  }

  // Utility methods
  private getTargetDate(timeframe: string): Date {
    const now = new Date()
    switch (timeframe) {
      case 'next_month': return addMonths(now, 1)
      case 'next_quarter': return addMonths(now, 3)
      case 'next_year': return addMonths(now, 12)
      default: return addMonths(now, 1)
    }
  }

  private generateId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API
  getMarketTrends(): MarketTrend[] {
    return [...this.marketTrends]
  }

  getPredictions(): Prediction[] {
    return [...this.predictions]
  }

  async generateInvestmentRecommendations(userProfile: any, marketConditions: any): Promise<InvestmentRecommendation[]> {
    const recommendations: InvestmentRecommendation[] = []

    // Conservative recommendations
    if (userProfile.riskTolerance === 'conservative') {
      recommendations.push({
        id: this.generateId(),
        type: 'bonds',
        name: 'Tesouro Direto IPCA+',
        description: 'Títulos públicos com proteção contra inflação',
        expectedReturn: 6.5,
        riskLevel: 'low',
        timeHorizon: 'medium',
        minimumInvestment: 30,
        liquidity: 'medium',
        reasoning: 'Ideal para perfil conservador com proteção inflacionária',
        pros: ['Baixo risco', 'Proteção contra inflação', 'Garantia do governo'],
        cons: ['Rentabilidade limitada', 'Liquidez diária limitada'],
        marketConditions: 'Favorável com Selic em alta',
        personalFit: 0.9,
        confidence: 0.85,
        createdAt: new Date()
      })
    }

    // Moderate recommendations
    if (userProfile.riskTolerance === 'moderate') {
      recommendations.push({
        id: this.generateId(),
        type: 'mixed',
        name: 'Carteira Balanceada',
        description: 'Mix de renda fixa e variável',
        expectedReturn: 9.2,
        riskLevel: 'medium',
        timeHorizon: 'medium',
        minimumInvestment: 100,
        liquidity: 'medium',
        reasoning: 'Equilibrio entre segurança e rentabilidade',
        pros: ['Diversificação', 'Potencial de crescimento', 'Risco controlado'],
        cons: ['Volatilidade moderada', 'Requer acompanhamento'],
        marketConditions: 'Neutro para positivo',
        personalFit: 0.8,
        confidence: 0.75,
        createdAt: new Date()
      })
    }

    return recommendations
  }
}

// Export singleton instance
export const predictiveAnalytics = PredictiveAnalytics.getInstance()
