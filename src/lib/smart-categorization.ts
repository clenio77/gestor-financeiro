// Smart Categorization System with ML
import { mlEngine } from './ml-engine'

export interface CategoryRule {
  id: string
  name: string
  keywords: string[]
  merchantPatterns: string[]
  amountRanges?: { min?: number; max?: number }[]
  confidence: number
  category: string
  subcategory?: string
  isActive: boolean
  createdAt: Date
  lastUsed?: Date
  usageCount: number
}

export interface CategorySuggestion {
  category: string
  subcategory?: string
  confidence: number
  reason: string
  rule?: CategoryRule
  similarTransactions: any[]
}

export interface TransactionClassification {
  transactionId: string
  originalCategory?: string
  suggestedCategory: string
  suggestedSubcategory?: string
  confidence: number
  suggestions: CategorySuggestion[]
  isAutoApplied: boolean
  needsReview: boolean
  reviewReason?: string
}

export interface LearningData {
  transactionText: string
  merchantName?: string
  amount: number
  category: string
  subcategory?: string
  userConfirmed: boolean
  timestamp: Date
}

class SmartCategorization {
  private static instance: SmartCategorization
  private rules: Map<string, CategoryRule> = new Map()
  private learningData: LearningData[] = []
  private categories: string[] = []
  private subcategories: Map<string, string[]> = new Map()

  private constructor() {
    this.initializeDefaultRules()
    this.loadLearningData()
    this.setupCategories()
  }

  static getInstance(): SmartCategorization {
    if (!SmartCategorization.instance) {
      SmartCategorization.instance = new SmartCategorization()
    }
    return SmartCategorization.instance
  }

  private initializeDefaultRules(): void {
    const defaultRules: Omit<CategoryRule, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>[] = [
      // Alimentação
      {
        name: 'Supermercados',
        keywords: ['supermercado', 'mercado', 'extra', 'carrefour', 'pao de acucar', 'walmart'],
        merchantPatterns: ['SUPERMERCADO*', 'MERCADO*', 'EXTRA*', 'CARREFOUR*'],
        confidence: 0.9,
        category: 'Alimentação',
        subcategory: 'Supermercado',
        isActive: true
      },
      {
        name: 'Restaurantes',
        keywords: ['restaurante', 'lanchonete', 'pizzaria', 'hamburgueria', 'ifood', 'uber eats'],
        merchantPatterns: ['RESTAURANTE*', 'LANCHONETE*', 'IFOOD*', 'UBER EATS*'],
        confidence: 0.85,
        category: 'Alimentação',
        subcategory: 'Restaurante',
        isActive: true
      },
      {
        name: 'Padaria',
        keywords: ['padaria', 'panificadora', 'confeitaria'],
        merchantPatterns: ['PADARIA*', 'PANIFICADORA*'],
        confidence: 0.9,
        category: 'Alimentação',
        subcategory: 'Padaria',
        isActive: true
      },

      // Transporte
      {
        name: 'Combustível',
        keywords: ['posto', 'gasolina', 'etanol', 'diesel', 'shell', 'petrobras', 'ipiranga'],
        merchantPatterns: ['POSTO*', 'SHELL*', 'PETROBRAS*', 'IPIRANGA*'],
        confidence: 0.95,
        category: 'Transporte',
        subcategory: 'Combustível',
        isActive: true
      },
      {
        name: 'Transporte Público',
        keywords: ['metro', 'onibus', 'trem', 'bilhete unico', 'cartao transporte'],
        merchantPatterns: ['METRO*', 'CPTM*', 'EMTU*'],
        confidence: 0.9,
        category: 'Transporte',
        subcategory: 'Público',
        isActive: true
      },
      {
        name: 'Uber/Taxi',
        keywords: ['uber', 'taxi', '99', 'cabify'],
        merchantPatterns: ['UBER*', 'TAXI*', '99*', 'CABIFY*'],
        confidence: 0.95,
        category: 'Transporte',
        subcategory: 'Aplicativo',
        isActive: true
      },

      // Saúde
      {
        name: 'Farmácia',
        keywords: ['farmacia', 'drogaria', 'droga raia', 'drogasil', 'pacheco'],
        merchantPatterns: ['FARMACIA*', 'DROGARIA*', 'DROGA RAIA*', 'DROGASIL*'],
        confidence: 0.9,
        category: 'Saúde',
        subcategory: 'Farmácia',
        isActive: true
      },
      {
        name: 'Médico/Dentista',
        keywords: ['clinica', 'hospital', 'medico', 'dentista', 'consulta'],
        merchantPatterns: ['CLINICA*', 'HOSPITAL*', 'DR.*', 'DRA.*'],
        confidence: 0.85,
        category: 'Saúde',
        subcategory: 'Consulta',
        isActive: true
      },

      // Educação
      {
        name: 'Escola/Universidade',
        keywords: ['escola', 'universidade', 'faculdade', 'colegio', 'curso'],
        merchantPatterns: ['ESCOLA*', 'UNIVERSIDADE*', 'FACULDADE*'],
        confidence: 0.9,
        category: 'Educação',
        subcategory: 'Mensalidade',
        isActive: true
      },

      // Lazer
      {
        name: 'Cinema/Teatro',
        keywords: ['cinema', 'teatro', 'show', 'ingresso'],
        merchantPatterns: ['CINEMA*', 'TEATRO*', 'INGRESSO*'],
        confidence: 0.9,
        category: 'Lazer',
        subcategory: 'Entretenimento',
        isActive: true
      },

      // Serviços
      {
        name: 'Streaming',
        keywords: ['netflix', 'spotify', 'amazon prime', 'disney plus', 'youtube premium'],
        merchantPatterns: ['NETFLIX*', 'SPOTIFY*', 'AMAZON PRIME*', 'DISNEY*'],
        confidence: 0.95,
        category: 'Serviços',
        subcategory: 'Streaming',
        isActive: true
      },
      {
        name: 'Telefonia/Internet',
        keywords: ['vivo', 'tim', 'claro', 'oi', 'internet', 'telefone'],
        merchantPatterns: ['VIVO*', 'TIM*', 'CLARO*', 'OI*'],
        confidence: 0.9,
        category: 'Serviços',
        subcategory: 'Telecomunicações',
        isActive: true
      },

      // Casa
      {
        name: 'Supermercado Casa',
        keywords: ['casa e construcao', 'leroy merlin', 'c&c', 'telhanorte'],
        merchantPatterns: ['LEROY MERLIN*', 'C&C*', 'TELHANORTE*'],
        confidence: 0.9,
        category: 'Casa',
        subcategory: 'Construção',
        isActive: true
      },

      // PIX e Transferências
      {
        name: 'PIX',
        keywords: ['pix', 'transferencia pix'],
        merchantPatterns: ['PIX*', 'TRANSFERENCIA PIX*'],
        confidence: 0.8,
        category: 'Transferência',
        subcategory: 'PIX',
        isActive: true
      }
    ]

    defaultRules.forEach(rule => {
      const fullRule: CategoryRule = {
        ...rule,
        id: this.generateRuleId(),
        createdAt: new Date(),
        usageCount: 0
      }
      this.rules.set(fullRule.id, fullRule)
    })
  }

  private setupCategories(): void {
    this.categories = [
      'Alimentação',
      'Transporte',
      'Saúde',
      'Educação',
      'Lazer',
      'Serviços',
      'Casa',
      'Roupas',
      'Investimentos',
      'Transferência',
      'Outros'
    ]

    this.subcategories.set('Alimentação', ['Supermercado', 'Restaurante', 'Padaria', 'Delivery'])
    this.subcategories.set('Transporte', ['Combustível', 'Público', 'Aplicativo', 'Estacionamento'])
    this.subcategories.set('Saúde', ['Farmácia', 'Consulta', 'Exames', 'Plano de Saúde'])
    this.subcategories.set('Educação', ['Mensalidade', 'Material', 'Curso'])
    this.subcategories.set('Lazer', ['Entretenimento', 'Viagem', 'Esporte'])
    this.subcategories.set('Serviços', ['Streaming', 'Telecomunicações', 'Bancários'])
    this.subcategories.set('Casa', ['Construção', 'Móveis', 'Limpeza', 'Contas'])
    this.subcategories.set('Transferência', ['PIX', 'TED', 'DOC'])
  }

  private loadLearningData(): void {
    try {
      const stored = localStorage.getItem('categorization_learning')
      if (stored) {
        this.learningData = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load learning data:', error)
    }
  }

  private saveLearningData(): void {
    try {
      localStorage.setItem('categorization_learning', JSON.stringify(this.learningData))
    } catch (error) {
      console.error('Failed to save learning data:', error)
    }
  }

  // Public API methods
  async categorizeTransaction(transaction: any): Promise<TransactionClassification> {
    const suggestions = await this.generateSuggestions(transaction)
    const bestSuggestion = suggestions[0]

    const classification: TransactionClassification = {
      transactionId: transaction.id,
      originalCategory: transaction.category,
      suggestedCategory: bestSuggestion?.category || 'Outros',
      suggestedSubcategory: bestSuggestion?.subcategory,
      confidence: bestSuggestion?.confidence || 0.1,
      suggestions,
      isAutoApplied: bestSuggestion?.confidence >= 0.8,
      needsReview: bestSuggestion?.confidence < 0.6
    }

    if (classification.needsReview) {
      classification.reviewReason = 'Baixa confiança na categorização automática'
    }

    return classification
  }

  async generateSuggestions(transaction: any): Promise<CategorySuggestion[]> {
    const suggestions: CategorySuggestion[] = []
    const description = transaction.description?.toLowerCase() || ''
    const merchantName = transaction.merchantName?.toLowerCase() || ''
    const amount = Math.abs(transaction.amount)

    // Rule-based suggestions
    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue

      let confidence = 0
      let matchReasons: string[] = []

      // Check keywords
      const keywordMatches = rule.keywords.filter(keyword => 
        description.includes(keyword.toLowerCase()) || 
        merchantName.includes(keyword.toLowerCase())
      )
      if (keywordMatches.length > 0) {
        confidence += 0.4 * (keywordMatches.length / rule.keywords.length)
        matchReasons.push(`Palavras-chave: ${keywordMatches.join(', ')}`)
      }

      // Check merchant patterns
      const merchantMatches = rule.merchantPatterns.filter(pattern => {
        const regex = new RegExp(pattern.replace('*', '.*'), 'i')
        return regex.test(merchantName) || regex.test(description)
      })
      if (merchantMatches.length > 0) {
        confidence += 0.5
        matchReasons.push(`Padrão do estabelecimento`)
      }

      // Check amount ranges
      if (rule.amountRanges) {
        const inRange = rule.amountRanges.some(range => {
          const minOk = !range.min || amount >= range.min
          const maxOk = !range.max || amount <= range.max
          return minOk && maxOk
        })
        if (inRange) {
          confidence += 0.1
          matchReasons.push('Valor dentro da faixa esperada')
        }
      }

      if (confidence > 0.2) {
        suggestions.push({
          category: rule.category,
          subcategory: rule.subcategory,
          confidence: Math.min(confidence * rule.confidence, 1),
          reason: matchReasons.join('; '),
          rule,
          similarTransactions: []
        })

        // Update rule usage
        rule.lastUsed = new Date()
        rule.usageCount++
      }
    }

    // ML-based suggestions using historical data
    const mlSuggestions = await this.generateMLSuggestions(transaction)
    suggestions.push(...mlSuggestions)

    // Sort by confidence and remove duplicates
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions)
    return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  private async generateMLSuggestions(transaction: any): Promise<CategorySuggestion[]> {
    if (this.learningData.length < 10) return []

    const suggestions: CategorySuggestion[] = []
    const description = transaction.description?.toLowerCase() || ''
    const merchantName = transaction.merchantName?.toLowerCase() || ''
    const amount = Math.abs(transaction.amount)

    // Find similar transactions
    const similarTransactions = this.learningData
      .filter(data => data.userConfirmed)
      .map(data => ({
        ...data,
        similarity: this.calculateSimilarity(
          { description, merchantName, amount },
          { 
            description: data.transactionText.toLowerCase(), 
            merchantName: data.merchantName?.toLowerCase() || '', 
            amount: data.amount 
          }
        )
      }))
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)

    if (similarTransactions.length > 0) {
      // Group by category and calculate confidence
      const categoryGroups = new Map<string, { count: number; avgSimilarity: number; subcategories: string[] }>()

      similarTransactions.forEach(tx => {
        const key = tx.category
        if (!categoryGroups.has(key)) {
          categoryGroups.set(key, { count: 0, avgSimilarity: 0, subcategories: [] })
        }
        const group = categoryGroups.get(key)!
        group.count++
        group.avgSimilarity = (group.avgSimilarity * (group.count - 1) + tx.similarity) / group.count
        if (tx.subcategory && !group.subcategories.includes(tx.subcategory)) {
          group.subcategories.push(tx.subcategory)
        }
      })

      categoryGroups.forEach((group, category) => {
        const confidence = Math.min(group.avgSimilarity * (group.count / similarTransactions.length), 0.9)
        
        suggestions.push({
          category,
          subcategory: group.subcategories[0], // Most common subcategory
          confidence,
          reason: `Baseado em ${group.count} transação(ões) similar(es)`,
          similarTransactions: similarTransactions.filter(tx => tx.category === category).slice(0, 3)
        })
      })
    }

    return suggestions
  }

  private calculateSimilarity(tx1: any, tx2: any): number {
    let similarity = 0

    // Text similarity (description)
    const textSim = this.calculateTextSimilarity(tx1.description, tx2.description)
    similarity += textSim * 0.4

    // Merchant similarity
    if (tx1.merchantName && tx2.merchantName) {
      const merchantSim = this.calculateTextSimilarity(tx1.merchantName, tx2.merchantName)
      similarity += merchantSim * 0.4
    }

    // Amount similarity
    const amountDiff = Math.abs(tx1.amount - tx2.amount)
    const maxAmount = Math.max(tx1.amount, tx2.amount)
    const amountSim = maxAmount > 0 ? 1 - (amountDiff / maxAmount) : 1
    similarity += Math.max(0, amountSim) * 0.2

    return Math.min(similarity, 1)
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0

    const words1 = text1.split(/\s+/).filter(w => w.length > 2)
    const words2 = text2.split(/\s+/).filter(w => w.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const commonWords = words1.filter(word => words2.includes(word))
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  private deduplicateSuggestions(suggestions: CategorySuggestion[]): CategorySuggestion[] {
    const seen = new Set<string>()
    return suggestions.filter(suggestion => {
      const key = `${suggestion.category}:${suggestion.subcategory || ''}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  // Learning methods
  confirmCategorization(transactionId: string, category: string, subcategory?: string): void {
    // This would be called when user confirms or corrects a categorization
    const transaction = this.findTransactionById(transactionId)
    if (!transaction) return

    const learningItem: LearningData = {
      transactionText: transaction.description || '',
      merchantName: transaction.merchantName,
      amount: Math.abs(transaction.amount),
      category,
      subcategory,
      userConfirmed: true,
      timestamp: new Date()
    }

    this.learningData.push(learningItem)
    
    // Keep only recent learning data (last 1000 items)
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-1000)
    }

    this.saveLearningData()
  }

  createCustomRule(rule: Omit<CategoryRule, 'id' | 'createdAt' | 'usageCount'>): CategoryRule {
    const newRule: CategoryRule = {
      ...rule,
      id: this.generateRuleId(),
      createdAt: new Date(),
      usageCount: 0
    }

    this.rules.set(newRule.id, newRule)
    return newRule
  }

  updateRule(ruleId: string, updates: Partial<CategoryRule>): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      Object.assign(rule, updates)
    }
  }

  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId)
  }

  getRules(): CategoryRule[] {
    return Array.from(this.rules.values())
  }

  getCategories(): string[] {
    return [...this.categories]
  }

  getSubcategories(category: string): string[] {
    return this.subcategories.get(category) || []
  }

  // Helper methods
  private findTransactionById(transactionId: string): any {
    // This would typically fetch from your transaction store
    // For now, return null as we don't have access to the transaction store
    return null
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Analytics
  getCategorizationStats(): any {
    const totalRules = this.rules.size
    const activeRules = Array.from(this.rules.values()).filter(r => r.isActive).length
    const totalLearningData = this.learningData.length
    const confirmedLearningData = this.learningData.filter(d => d.userConfirmed).length

    return {
      totalRules,
      activeRules,
      totalLearningData,
      confirmedLearningData,
      accuracyRate: confirmedLearningData > 0 ? confirmedLearningData / totalLearningData : 0
    }
  }
}

// Export singleton instance
export const smartCategorization = SmartCategorization.getInstance()
