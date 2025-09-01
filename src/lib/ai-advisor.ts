// Advanced AI Financial Advisor System
import { formatDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface UserProfile {
  id: string
  name: string
  age: number
  income: number
  expenses: number
  savings: number
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  financialGoals: FinancialGoal[]
  investmentExperience: 'beginner' | 'intermediate' | 'advanced'
  timeHorizon: 'short' | 'medium' | 'long'
  preferences: UserPreferences
}

export interface FinancialGoal {
  id: string
  type: 'emergency_fund' | 'house' | 'car' | 'vacation' | 'retirement' | 'education' | 'investment' | 'debt_payoff'
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  priority: 'low' | 'medium' | 'high'
  status: 'planning' | 'in_progress' | 'completed' | 'paused'
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical'
  notificationFrequency: 'daily' | 'weekly' | 'monthly'
  focusAreas: string[]
  investmentTypes: string[]
  excludedCategories: string[]
}

export interface AIRecommendation {
  id: string
  type: 'investment' | 'savings' | 'budget' | 'debt' | 'goal' | 'risk' | 'tax'
  title: string
  description: string
  reasoning: string
  impact: 'low' | 'medium' | 'high'
  urgency: 'low' | 'medium' | 'high'
  confidence: number
  estimatedBenefit: number
  timeToImplement: string
  steps: ActionStep[]
  relatedGoals: string[]
  createdAt: Date
  status: 'pending' | 'accepted' | 'rejected' | 'implemented'
}

export interface ActionStep {
  id: string
  description: string
  completed: boolean
  dueDate?: Date
  resources?: string[]
}

export interface MarketInsight {
  id: string
  category: 'stocks' | 'bonds' | 'crypto' | 'real_estate' | 'commodities' | 'economy'
  title: string
  summary: string
  impact: 'positive' | 'negative' | 'neutral'
  relevance: number
  source: string
  publishedAt: Date
  personalRelevance?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: ChatContext
  suggestions?: string[]
}

export interface ChatContext {
  topic: string
  relatedData?: any
  userIntent: string
  confidence: number
}

export interface FinancialScenario {
  id: string
  name: string
  description: string
  assumptions: ScenarioAssumption[]
  projections: ScenarioProjection[]
  probability: number
  impact: 'positive' | 'negative' | 'neutral'
  recommendations: string[]
}

export interface ScenarioAssumption {
  parameter: string
  currentValue: number
  projectedValue: number
  changePercent: number
}

export interface ScenarioProjection {
  period: string
  income: number
  expenses: number
  savings: number
  netWorth: number
  goalProgress: { [goalId: string]: number }
}

class AIFinancialAdvisor {
  private static instance: AIFinancialAdvisor
  private userProfile: UserProfile | null = null
  private chatHistory: ChatMessage[] = []
  private recommendations: AIRecommendation[] = []
  private marketInsights: MarketInsight[] = []

  private constructor() {
    this.loadUserData()
    this.initializeAI()
  }

  static getInstance(): AIFinancialAdvisor {
    if (!AIFinancialAdvisor.instance) {
      AIFinancialAdvisor.instance = new AIFinancialAdvisor()
    }
    return AIFinancialAdvisor.instance
  }

  private loadUserData(): void {
    try {
      const stored = localStorage.getItem('ai_advisor_data')
      if (stored) {
        const data = JSON.parse(stored)
        this.userProfile = data.userProfile
        this.chatHistory = data.chatHistory?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || []
        this.recommendations = data.recommendations?.map((rec: any) => ({
          ...rec,
          createdAt: new Date(rec.createdAt)
        })) || []
      }
    } catch (error) {
      console.error('Failed to load AI advisor data:', error)
    }
  }

  private saveUserData(): void {
    try {
      const data = {
        userProfile: this.userProfile,
        chatHistory: this.chatHistory,
        recommendations: this.recommendations
      }
      localStorage.setItem('ai_advisor_data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save AI advisor data:', error)
    }
  }

  private initializeAI(): void {
    // Initialize AI models and load market data
    this.loadMarketInsights()
    this.generateInitialRecommendations()
  }

  // Public API Methods
  async setUserProfile(profile: UserProfile): Promise<void> {
    this.userProfile = profile
    this.saveUserData()
    await this.generatePersonalizedRecommendations()
  }

  async sendMessage(message: string): Promise<ChatMessage> {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    this.chatHistory.push(userMessage)

    // Analyze user intent and generate response
    const context = await this.analyzeUserIntent(message)
    const response = await this.generateAIResponse(message, context)

    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      context: context,
      suggestions: response.suggestions
    }

    this.chatHistory.push(assistantMessage)
    this.saveUserData()

    return assistantMessage
  }

  private async analyzeUserIntent(message: string): Promise<ChatContext> {
    // Simplified intent analysis - in production, use NLP service
    const lowerMessage = message.toLowerCase()
    
    let topic = 'general'
    let userIntent = 'question'
    let confidence = 0.7

    // Investment related
    if (lowerMessage.includes('investir') || lowerMessage.includes('investimento') || 
        lowerMessage.includes('ações') || lowerMessage.includes('renda fixa')) {
      topic = 'investment'
      userIntent = 'investment_advice'
      confidence = 0.9
    }
    // Budget related
    else if (lowerMessage.includes('orçamento') || lowerMessage.includes('gastos') || 
             lowerMessage.includes('economizar')) {
      topic = 'budget'
      userIntent = 'budget_optimization'
      confidence = 0.85
    }
    // Goals related
    else if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo') || 
             lowerMessage.includes('plano')) {
      topic = 'goals'
      userIntent = 'goal_planning'
      confidence = 0.8
    }
    // Debt related
    else if (lowerMessage.includes('dívida') || lowerMessage.includes('empréstimo') || 
             lowerMessage.includes('financiamento')) {
      topic = 'debt'
      userIntent = 'debt_management'
      confidence = 0.85
    }

    return {
      topic,
      userIntent,
      confidence,
      relatedData: this.getRelatedData(topic)
    }
  }

  private async generateAIResponse(message: string, context: ChatContext): Promise<{content: string, suggestions: string[]}> {
    if (!this.userProfile) {
      return {
        content: "Olá! Para fornecer conselhos personalizados, preciso conhecer melhor seu perfil financeiro. Que tal começarmos configurando suas informações básicas?",
        suggestions: [
          "Configurar perfil financeiro",
          "Ver recomendações gerais",
          "Conhecer funcionalidades da IA"
        ]
      }
    }

    let response = ""
    let suggestions: string[] = []

    switch (context.topic) {
      case 'investment':
        response = this.generateInvestmentAdvice(message, context)
        suggestions = [
          "Quais são os melhores investimentos para meu perfil?",
          "Como diversificar minha carteira?",
          "Quando devo rebalancear investimentos?"
        ]
        break

      case 'budget':
        response = this.generateBudgetAdvice(message, context)
        suggestions = [
          "Como reduzir gastos desnecessários?",
          "Qual percentual ideal para cada categoria?",
          "Como criar um orçamento eficiente?"
        ]
        break

      case 'goals':
        response = this.generateGoalAdvice(message, context)
        suggestions = [
          "Como definir metas financeiras realistas?",
          "Qual a melhor estratégia para meus objetivos?",
          "Como acelerar o progresso das minhas metas?"
        ]
        break

      case 'debt':
        response = this.generateDebtAdvice(message, context)
        suggestions = [
          "Qual dívida pagar primeiro?",
          "Como negociar melhores condições?",
          "Vale a pena antecipar pagamentos?"
        ]
        break

      default:
        response = this.generateGeneralAdvice(message, context)
        suggestions = [
          "Analisar minha situação financeira",
          "Sugerir investimentos",
          "Otimizar meu orçamento"
        ]
    }

    return { content: response, suggestions }
  }

  private generateInvestmentAdvice(message: string, context: ChatContext): string {
    if (!this.userProfile) return "Preciso do seu perfil para dar conselhos de investimento."

    const { riskTolerance, investmentExperience, timeHorizon } = this.userProfile
    
    let advice = `Com base no seu perfil ${riskTolerance} e experiência ${investmentExperience}, `

    if (riskTolerance === 'conservative') {
      advice += "recomendo focar em renda fixa como Tesouro Direto, CDBs e fundos DI. "
      advice += "Para diversificar, considere até 20% em fundos imobiliários."
    } else if (riskTolerance === 'moderate') {
      advice += "sugiro uma carteira balanceada: 60% renda fixa, 30% ações e 10% fundos imobiliários. "
      advice += "Considere ETFs para exposição ao mercado de ações."
    } else {
      advice += "você pode ter maior exposição a ações (até 70%) e considerar investimentos alternativos. "
      advice += "Diversifique entre ações nacionais, internacionais e setores diferentes."
    }

    if (timeHorizon === 'long') {
      advice += " Com horizonte de longo prazo, você pode aproveitar melhor o potencial de crescimento dos ativos de risco."
    }

    return advice
  }

  private generateBudgetAdvice(message: string, context: ChatContext): string {
    if (!this.userProfile) return "Preciso conhecer sua situação financeira para otimizar seu orçamento."

    const { income, expenses } = this.userProfile
    const savingsRate = ((income - expenses) / income) * 100

    let advice = `Analisando seu orçamento, você está poupando ${savingsRate.toFixed(1)}% da renda. `

    if (savingsRate < 10) {
      advice += "Recomendo aumentar sua taxa de poupança para pelo menos 20%. "
      advice += "Analise gastos supérfluos e considere renegociar contratos fixos."
    } else if (savingsRate < 20) {
      advice += "Sua taxa de poupança está razoável, mas pode melhorar. "
      advice += "Tente identificar pequenos gastos que podem ser eliminados."
    } else {
      advice += "Excelente taxa de poupança! "
      advice += "Agora foque em otimizar onde investir esse dinheiro."
    }

    advice += " Sugiro a regra 50-30-20: 50% necessidades, 30% desejos, 20% poupança."

    return advice
  }

  private generateGoalAdvice(message: string, context: ChatContext): string {
    if (!this.userProfile?.financialGoals.length) {
      return "Vamos definir suas metas financeiras! Recomendo começar com uma reserva de emergência equivalente a 6 meses de gastos."
    }

    const goals = this.userProfile.financialGoals
    const priorityGoals = goals.filter(g => g.priority === 'high')

    let advice = `Você tem ${goals.length} metas definidas. `

    if (priorityGoals.length > 0) {
      const nextGoal = priorityGoals[0]
      const monthsToGoal = this.calculateMonthsToGoal(nextGoal)
      const monthlyAmount = (nextGoal.targetAmount - nextGoal.currentAmount) / monthsToGoal

      advice += `Sua próxima meta prioritária é "${nextGoal.name}". `
      advice += `Para atingi-la, você precisa poupar R$ ${monthlyAmount.toFixed(2)} por mês. `
    }

    advice += "Lembre-se: metas específicas, mensuráveis e com prazo têm maior chance de sucesso!"

    return advice
  }

  private generateDebtAdvice(message: string, context: ChatContext): string {
    // Simplified debt advice - in production, analyze actual debt data
    return "Para gerenciar dívidas eficientemente, recomendo a estratégia 'avalanche': " +
           "quite primeiro as dívidas com maior taxa de juros. " +
           "Se precisar de motivação, use a estratégia 'bola de neve': " +
           "quite primeiro as menores dívidas. " +
           "Sempre negocie condições melhores e evite o pagamento mínimo do cartão."
  }

  private generateGeneralAdvice(message: string, context: ChatContext): string {
    return "Estou aqui para ajudar com suas finanças! " +
           "Posso analisar investimentos, otimizar orçamentos, planejar metas e muito mais. " +
           "Que área financeira você gostaria de melhorar primeiro?"
  }

  private getRelatedData(topic: string): any {
    if (!this.userProfile) return null

    switch (topic) {
      case 'investment':
        return {
          riskTolerance: this.userProfile.riskTolerance,
          experience: this.userProfile.investmentExperience,
          timeHorizon: this.userProfile.timeHorizon
        }
      case 'budget':
        return {
          income: this.userProfile.income,
          expenses: this.userProfile.expenses,
          savingsRate: ((this.userProfile.income - this.userProfile.expenses) / this.userProfile.income) * 100
        }
      case 'goals':
        return {
          goals: this.userProfile.financialGoals,
          totalGoals: this.userProfile.financialGoals.length
        }
      default:
        return null
    }
  }

  private calculateMonthsToGoal(goal: FinancialGoal): number {
    const now = new Date()
    const target = new Date(goal.targetDate)
    const diffTime = Math.abs(target.getTime() - now.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
  }

  async generatePersonalizedRecommendations(): Promise<AIRecommendation[]> {
    if (!this.userProfile) return []

    const recommendations: AIRecommendation[] = []

    // Emergency fund recommendation
    if (this.userProfile.savings < this.userProfile.expenses * 6) {
      recommendations.push({
        id: this.generateId(),
        type: 'savings',
        title: 'Construir Reserva de Emergência',
        description: 'Sua reserva de emergência está abaixo do recomendado',
        reasoning: 'Uma reserva de emergência de 6 meses de gastos é fundamental para segurança financeira',
        impact: 'high',
        urgency: 'high',
        confidence: 0.95,
        estimatedBenefit: this.userProfile.expenses * 6 - this.userProfile.savings,
        timeToImplement: '6-12 meses',
        steps: [
          {
            id: this.generateId(),
            description: 'Definir meta de reserva de emergência',
            completed: false
          },
          {
            id: this.generateId(),
            description: 'Abrir conta poupança ou CDB líquido',
            completed: false
          },
          {
            id: this.generateId(),
            description: 'Automatizar transferência mensal',
            completed: false
          }
        ],
        relatedGoals: this.userProfile.financialGoals
          .filter(g => g.type === 'emergency_fund')
          .map(g => g.id),
        createdAt: new Date(),
        status: 'pending'
      })
    }

    // Investment diversification
    if (this.userProfile.riskTolerance !== 'conservative' && this.userProfile.savings > this.userProfile.expenses * 6) {
      recommendations.push({
        id: this.generateId(),
        type: 'investment',
        title: 'Diversificar Investimentos',
        description: 'Considere diversificar além da poupança',
        reasoning: 'Com reserva de emergência adequada, você pode buscar rentabilidade maior',
        impact: 'high',
        urgency: 'medium',
        confidence: 0.85,
        estimatedBenefit: this.userProfile.savings * 0.05, // 5% additional return
        timeToImplement: '1-3 meses',
        steps: [
          {
            id: this.generateId(),
            description: 'Estudar opções de investimento',
            completed: false
          },
          {
            id: this.generateId(),
            description: 'Abrir conta em corretora',
            completed: false
          },
          {
            id: this.generateId(),
            description: 'Fazer primeira aplicação',
            completed: false
          }
        ],
        relatedGoals: this.userProfile.financialGoals
          .filter(g => g.type === 'investment')
          .map(g => g.id),
        createdAt: new Date(),
        status: 'pending'
      })
    }

    this.recommendations = [...this.recommendations, ...recommendations]
    this.saveUserData()

    return recommendations
  }

  private generateInitialRecommendations(): void {
    // Generate some general recommendations
    const generalRecs: AIRecommendation[] = [
      {
        id: this.generateId(),
        type: 'budget',
        title: 'Controlar Gastos Mensais',
        description: 'Monitore e categorize todos os seus gastos',
        reasoning: 'O controle de gastos é a base de uma vida financeira saudável',
        impact: 'high',
        urgency: 'high',
        confidence: 0.9,
        estimatedBenefit: 0,
        timeToImplement: 'Imediato',
        steps: [
          {
            id: this.generateId(),
            description: 'Registrar todas as transações',
            completed: false
          },
          {
            id: this.generateId(),
            description: 'Categorizar gastos por tipo',
            completed: false
          },
          {
            id: this.generateId(),
            description: 'Analisar padrões mensalmente',
            completed: false
          }
        ],
        relatedGoals: [],
        createdAt: new Date(),
        status: 'pending'
      }
    ]

    this.recommendations = generalRecs
  }

  private loadMarketInsights(): void {
    // Simulate market insights - in production, fetch from financial APIs
    this.marketInsights = [
      {
        id: this.generateId(),
        category: 'economy',
        title: 'Taxa Selic em Alta',
        summary: 'Banco Central mantém tendência de alta na taxa básica de juros',
        impact: 'positive',
        relevance: 0.8,
        source: 'Banco Central',
        publishedAt: new Date(),
        personalRelevance: 'Bom momento para renda fixa'
      },
      {
        id: this.generateId(),
        category: 'stocks',
        title: 'Setor de Tecnologia em Crescimento',
        summary: 'Ações de tecnologia apresentam valorização consistente',
        impact: 'positive',
        relevance: 0.7,
        source: 'Análise de Mercado',
        publishedAt: new Date(),
        personalRelevance: 'Considere ETFs de tecnologia'
      }
    ]
  }

  // Scenario Analysis
  async generateScenarios(): Promise<FinancialScenario[]> {
    if (!this.userProfile) return []

    const scenarios: FinancialScenario[] = [
      {
        id: this.generateId(),
        name: 'Cenário Otimista',
        description: 'Crescimento econômico e aumento de renda',
        assumptions: [
          { parameter: 'Renda', currentValue: this.userProfile.income, projectedValue: this.userProfile.income * 1.1, changePercent: 10 },
          { parameter: 'Inflação', currentValue: 5, projectedValue: 3, changePercent: -40 }
        ],
        projections: this.calculateProjections('optimistic'),
        probability: 0.3,
        impact: 'positive',
        recommendations: [
          'Considere aumentar investimentos em renda variável',
          'Antecipe pagamento de dívidas com juros altos'
        ]
      },
      {
        id: this.generateId(),
        name: 'Cenário Pessimista',
        description: 'Recessão econômica e redução de renda',
        assumptions: [
          { parameter: 'Renda', currentValue: this.userProfile.income, projectedValue: this.userProfile.income * 0.9, changePercent: -10 },
          { parameter: 'Inflação', currentValue: 5, projectedValue: 8, changePercent: 60 }
        ],
        projections: this.calculateProjections('pessimistic'),
        probability: 0.2,
        impact: 'negative',
        recommendations: [
          'Fortaleça sua reserva de emergência',
          'Reduza gastos não essenciais',
          'Considere renda fixa para proteção'
        ]
      }
    ]

    return scenarios
  }

  private calculateProjections(scenario: 'optimistic' | 'pessimistic'): ScenarioProjection[] {
    if (!this.userProfile) return []

    const multiplier = scenario === 'optimistic' ? 1.1 : 0.9
    const projections: ScenarioProjection[] = []

    for (let i = 1; i <= 12; i++) {
      const income = this.userProfile.income * multiplier
      const expenses = this.userProfile.expenses * (scenario === 'pessimistic' ? 1.05 : 0.98)
      const savings = income - expenses
      
      projections.push({
        period: `Mês ${i}`,
        income,
        expenses,
        savings,
        netWorth: this.userProfile.savings + (savings * i),
        goalProgress: this.calculateGoalProgress(savings * i)
      })
    }

    return projections
  }

  private calculateGoalProgress(additionalSavings: number): { [goalId: string]: number } {
    if (!this.userProfile) return {}

    const progress: { [goalId: string]: number } = {}
    
    this.userProfile.financialGoals.forEach(goal => {
      const newAmount = goal.currentAmount + additionalSavings
      progress[goal.id] = Math.min((newAmount / goal.targetAmount) * 100, 100)
    })

    return progress
  }

  // Getters
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory]
  }

  getRecommendations(): AIRecommendation[] {
    return [...this.recommendations]
  }

  getMarketInsights(): MarketInsight[] {
    return [...this.marketInsights]
  }

  getUserProfile(): UserProfile | null {
    return this.userProfile
  }

  // Advanced Analysis Methods
  async analyzeCashFlowTrends(transactions: any[]): Promise<any> {
    if (!transactions.length) return null

    const monthlyData = this.groupTransactionsByMonth(transactions)
    const trends = this.calculateTrends(monthlyData)

    return {
      trends,
      insights: this.generateCashFlowInsights(trends),
      predictions: this.predictFutureCashFlow(trends)
    }
  }

  private groupTransactionsByMonth(transactions: any[]): any[] {
    const grouped = transactions.reduce((acc, tx) => {
      const month = formatDate(new Date(tx.date), 'yyyy-MM', { locale: ptBR })
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0, net: 0 }
      }

      if (tx.type === 'income') {
        acc[month].income += tx.amount
      } else {
        acc[month].expenses += Math.abs(tx.amount)
      }
      acc[month].net = acc[month].income - acc[month].expenses

      return acc
    }, {})

    return Object.entries(grouped).map(([month, data]) => ({
      month,
      ...(data as any)
    }))
  }

  private calculateTrends(monthlyData: any[]): any {
    if (monthlyData.length < 2) return null

    const incomeGrowth = this.calculateGrowthRate(monthlyData.map(d => d.income))
    const expenseGrowth = this.calculateGrowthRate(monthlyData.map(d => d.expenses))
    const netGrowth = this.calculateGrowthRate(monthlyData.map(d => d.net))

    return {
      incomeGrowth,
      expenseGrowth,
      netGrowth,
      volatility: this.calculateVolatility(monthlyData.map(d => d.net))
    }
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0
    const first = values[0]
    const last = values[values.length - 1]
    return first !== 0 ? ((last - first) / first) * 100 : 0
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  private generateCashFlowInsights(trends: any): string[] {
    const insights: string[] = []

    if (trends.incomeGrowth > 5) {
      insights.push("Sua renda está crescendo consistentemente. Considere aumentar seus investimentos.")
    } else if (trends.incomeGrowth < -5) {
      insights.push("Sua renda está em declínio. Foque em reduzir gastos e diversificar fontes de renda.")
    }

    if (trends.expenseGrowth > 10) {
      insights.push("Seus gastos estão crescendo rapidamente. Revise seu orçamento para identificar oportunidades de economia.")
    }

    if (trends.volatility > 1000) {
      insights.push("Seu fluxo de caixa está muito volátil. Considere criar uma reserva maior para estabilizar suas finanças.")
    }

    return insights
  }

  private predictFutureCashFlow(trends: any): any[] {
    const predictions = []
    const baseIncome = this.userProfile?.income || 0
    const baseExpenses = this.userProfile?.expenses || 0

    for (let i = 1; i <= 6; i++) {
      const projectedIncome = baseIncome * (1 + (trends.incomeGrowth / 100) * (i / 12))
      const projectedExpenses = baseExpenses * (1 + (trends.expenseGrowth / 100) * (i / 12))

      predictions.push({
        month: i,
        projectedIncome,
        projectedExpenses,
        projectedNet: projectedIncome - projectedExpenses
      })
    }

    return predictions
  }

  // Risk Assessment
  async assessFinancialRisk(): Promise<any> {
    if (!this.userProfile) return null

    const riskFactors = {
      emergencyFund: this.assessEmergencyFundRisk(),
      debtToIncome: this.assessDebtRisk(),
      investmentDiversification: this.assessDiversificationRisk(),
      incomeStability: this.assessIncomeStabilityRisk()
    }

    const overallRisk = this.calculateOverallRisk(riskFactors)
    const recommendations = this.generateRiskRecommendations(riskFactors)

    return {
      riskFactors,
      overallRisk,
      recommendations,
      riskScore: this.calculateRiskScore(riskFactors)
    }
  }

  private assessEmergencyFundRisk(): { level: string; score: number; description: string } {
    if (!this.userProfile) return { level: 'high', score: 0, description: 'Sem dados' }

    const monthsOfExpenses = this.userProfile.savings / this.userProfile.expenses

    if (monthsOfExpenses >= 6) {
      return { level: 'low', score: 90, description: 'Reserva de emergência adequada' }
    } else if (monthsOfExpenses >= 3) {
      return { level: 'medium', score: 60, description: 'Reserva de emergência parcial' }
    } else {
      return { level: 'high', score: 20, description: 'Reserva de emergência insuficiente' }
    }
  }

  private assessDebtRisk(): { level: string; score: number; description: string } {
    // Simplified - in production, analyze actual debt data
    return { level: 'low', score: 80, description: 'Nível de endividamento controlado' }
  }

  private assessDiversificationRisk(): { level: string; score: number; description: string } {
    if (!this.userProfile) return { level: 'high', score: 0, description: 'Sem dados' }

    // Simplified assessment based on risk tolerance
    if (this.userProfile.riskTolerance === 'conservative') {
      return { level: 'low', score: 70, description: 'Perfil conservador com baixo risco' }
    } else if (this.userProfile.riskTolerance === 'moderate') {
      return { level: 'medium', score: 60, description: 'Diversificação moderada necessária' }
    } else {
      return { level: 'high', score: 40, description: 'Alta exposição a risco requer diversificação' }
    }
  }

  private assessIncomeStabilityRisk(): { level: string; score: number; description: string } {
    // Simplified - in production, analyze income history
    return { level: 'medium', score: 70, description: 'Renda relativamente estável' }
  }

  private calculateOverallRisk(riskFactors: any): string {
    const avgScore = Object.values(riskFactors).reduce((sum: number, factor: any) => sum + factor.score, 0) / Object.keys(riskFactors).length

    if (avgScore >= 80) return 'low'
    if (avgScore >= 60) return 'medium'
    return 'high'
  }

  private calculateRiskScore(riskFactors: any): number {
    return Object.values(riskFactors).reduce((sum: number, factor: any) => sum + factor.score, 0) / Object.keys(riskFactors).length
  }

  private generateRiskRecommendations(riskFactors: any): string[] {
    const recommendations: string[] = []

    if (riskFactors.emergencyFund.level === 'high') {
      recommendations.push("Priorize a construção de uma reserva de emergência")
    }

    if (riskFactors.investmentDiversification.level === 'high') {
      recommendations.push("Diversifique seus investimentos para reduzir riscos")
    }

    if (riskFactors.incomeStability.level === 'high') {
      recommendations.push("Considere desenvolver fontes de renda alternativas")
    }

    return recommendations
  }

  // Utility methods
  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Recommendation management
  acceptRecommendation(recommendationId: string): void {
    const rec = this.recommendations.find(r => r.id === recommendationId)
    if (rec) {
      rec.status = 'accepted'
      this.saveUserData()
    }
  }

  rejectRecommendation(recommendationId: string): void {
    const rec = this.recommendations.find(r => r.id === recommendationId)
    if (rec) {
      rec.status = 'rejected'
      this.saveUserData()
    }
  }

  markRecommendationImplemented(recommendationId: string): void {
    const rec = this.recommendations.find(r => r.id === recommendationId)
    if (rec) {
      rec.status = 'implemented'
      this.saveUserData()
    }
  }
}

// Export singleton instance
export const aiAdvisor = AIFinancialAdvisor.getInstance()
