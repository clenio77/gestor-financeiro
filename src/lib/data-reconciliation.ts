// Data Reconciliation System for Banking Integration
import { BankTransaction } from './banking-integration'
import { smartCategorization } from './smart-categorization'

export interface ReconciliationMatch {
  id: string
  bankTransaction: BankTransaction
  appTransaction?: any
  matchType: 'exact' | 'fuzzy' | 'manual' | 'none'
  confidence: number
  matchReasons: string[]
  status: 'matched' | 'unmatched' | 'conflict' | 'duplicate'
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export interface ReconciliationConflict {
  id: string
  bankTransaction: BankTransaction
  appTransaction: any
  conflictType: 'amount' | 'date' | 'description' | 'category'
  bankValue: any
  appValue: any
  suggestedResolution: 'use_bank' | 'use_app' | 'merge' | 'manual_review'
  confidence: number
  createdAt: Date
  resolvedAt?: Date
  resolution?: 'use_bank' | 'use_app' | 'merge' | 'ignore'
}

export interface DuplicateGroup {
  id: string
  transactions: (BankTransaction | any)[]
  duplicateType: 'exact' | 'similar' | 'potential'
  confidence: number
  suggestedAction: 'keep_bank' | 'keep_app' | 'merge' | 'keep_all'
  createdAt: Date
  resolvedAt?: Date
  resolution?: string
}

export interface ReconciliationSummary {
  totalBankTransactions: number
  totalAppTransactions: number
  matched: number
  unmatched: number
  conflicts: number
  duplicates: number
  accuracy: number
  lastReconciliation: Date
}

class DataReconciliation {
  private static instance: DataReconciliation
  private matches: Map<string, ReconciliationMatch> = new Map()
  private conflicts: Map<string, ReconciliationConflict> = new Map()
  private duplicateGroups: Map<string, DuplicateGroup> = new Map()

  private constructor() {
    this.loadReconciliationData()
  }

  static getInstance(): DataReconciliation {
    if (!DataReconciliation.instance) {
      DataReconciliation.instance = new DataReconciliation()
    }
    return DataReconciliation.instance
  }

  private loadReconciliationData(): void {
    try {
      const matches = localStorage.getItem('reconciliation_matches')
      if (matches) {
        const parsedMatches = JSON.parse(matches)
        parsedMatches.forEach((match: any) => {
          this.matches.set(match.id, {
            ...match,
            createdAt: new Date(match.createdAt),
            reviewedAt: match.reviewedAt ? new Date(match.reviewedAt) : undefined
          })
        })
      }

      const conflicts = localStorage.getItem('reconciliation_conflicts')
      if (conflicts) {
        const parsedConflicts = JSON.parse(conflicts)
        parsedConflicts.forEach((conflict: any) => {
          this.conflicts.set(conflict.id, {
            ...conflict,
            createdAt: new Date(conflict.createdAt),
            resolvedAt: conflict.resolvedAt ? new Date(conflict.resolvedAt) : undefined
          })
        })
      }

      const duplicates = localStorage.getItem('reconciliation_duplicates')
      if (duplicates) {
        const parsedDuplicates = JSON.parse(duplicates)
        parsedDuplicates.forEach((duplicate: any) => {
          this.duplicateGroups.set(duplicate.id, {
            ...duplicate,
            createdAt: new Date(duplicate.createdAt),
            resolvedAt: duplicate.resolvedAt ? new Date(duplicate.resolvedAt) : undefined
          })
        })
      }
    } catch (error) {
      console.error('Failed to load reconciliation data:', error)
    }
  }

  private saveReconciliationData(): void {
    try {
      localStorage.setItem('reconciliation_matches', JSON.stringify(Array.from(this.matches.values())))
      localStorage.setItem('reconciliation_conflicts', JSON.stringify(Array.from(this.conflicts.values())))
      localStorage.setItem('reconciliation_duplicates', JSON.stringify(Array.from(this.duplicateGroups.values())))
    } catch (error) {
      console.error('Failed to save reconciliation data:', error)
    }
  }

  // Main reconciliation method
  async reconcileTransactions(
    bankTransactions: BankTransaction[], 
    appTransactions: any[]
  ): Promise<ReconciliationSummary> {
    console.log(`Starting reconciliation: ${bankTransactions.length} bank, ${appTransactions.length} app transactions`)

    // Clear previous matches for this reconciliation
    this.clearPreviousMatches()

    // Step 1: Find exact matches
    await this.findExactMatches(bankTransactions, appTransactions)

    // Step 2: Find fuzzy matches
    await this.findFuzzyMatches(bankTransactions, appTransactions)

    // Step 3: Detect duplicates
    await this.detectDuplicates(bankTransactions, appTransactions)

    // Step 4: Identify conflicts
    await this.identifyConflicts()

    // Step 5: Auto-categorize unmatched bank transactions
    await this.categorizeBankTransactions(bankTransactions)

    this.saveReconciliationData()

    return this.generateSummary(bankTransactions, appTransactions)
  }

  private clearPreviousMatches(): void {
    // Keep only manually reviewed matches
    const manualMatches = Array.from(this.matches.values()).filter(m => m.reviewedAt)
    this.matches.clear()
    manualMatches.forEach(match => this.matches.set(match.id, match))
  }

  private async findExactMatches(bankTransactions: BankTransaction[], appTransactions: any[]): Promise<void> {
    const unmatchedBank = bankTransactions.filter(bt => !this.isTransactionMatched(bt.id, 'bank'))
    const unmatchedApp = appTransactions.filter(at => !this.isTransactionMatched(at.id, 'app'))

    for (const bankTx of unmatchedBank) {
      for (const appTx of unmatchedApp) {
        const match = this.calculateExactMatch(bankTx, appTx)
        if (match.confidence >= 0.95) {
          const reconciliationMatch: ReconciliationMatch = {
            id: this.generateMatchId(),
            bankTransaction: bankTx,
            appTransaction: appTx,
            matchType: 'exact',
            confidence: match.confidence,
            matchReasons: match.reasons,
            status: 'matched',
            createdAt: new Date()
          }

          this.matches.set(reconciliationMatch.id, reconciliationMatch)
          break // Move to next bank transaction
        }
      }
    }
  }

  private async findFuzzyMatches(bankTransactions: BankTransaction[], appTransactions: any[]): Promise<void> {
    const unmatchedBank = bankTransactions.filter(bt => !this.isTransactionMatched(bt.id, 'bank'))
    const unmatchedApp = appTransactions.filter(at => !this.isTransactionMatched(at.id, 'app'))

    for (const bankTx of unmatchedBank) {
      let bestMatch: { appTx: any; confidence: number; reasons: string[] } | null = null

      for (const appTx of unmatchedApp) {
        const match = this.calculateFuzzyMatch(bankTx, appTx)
        if (match.confidence >= 0.7 && (!bestMatch || match.confidence > bestMatch.confidence)) {
          bestMatch = { appTx, confidence: match.confidence, reasons: match.reasons }
        }
      }

      if (bestMatch) {
        const reconciliationMatch: ReconciliationMatch = {
          id: this.generateMatchId(),
          bankTransaction: bankTx,
          appTransaction: bestMatch.appTx,
          matchType: 'fuzzy',
          confidence: bestMatch.confidence,
          matchReasons: bestMatch.reasons,
          status: bestMatch.confidence >= 0.85 ? 'matched' : 'conflict',
          createdAt: new Date()
        }

        this.matches.set(reconciliationMatch.id, reconciliationMatch)
      }
    }
  }

  private calculateExactMatch(bankTx: BankTransaction, appTx: any): { confidence: number; reasons: string[] } {
    const reasons: string[] = []
    let confidence = 0

    // Amount match (most important)
    if (Math.abs(bankTx.amount - appTx.amount) < 0.01) {
      confidence += 0.4
      reasons.push('Valor exato')
    }

    // Date match (within 1 day)
    const dateDiff = Math.abs(bankTx.date.getTime() - new Date(appTx.date).getTime())
    if (dateDiff <= 24 * 60 * 60 * 1000) {
      confidence += 0.3
      reasons.push('Data compatível')
    }

    // Description similarity
    const descSimilarity = this.calculateTextSimilarity(
      bankTx.description.toLowerCase(),
      appTx.description?.toLowerCase() || ''
    )
    if (descSimilarity >= 0.8) {
      confidence += 0.2
      reasons.push('Descrição similar')
    }

    // Reference match
    if (bankTx.reference && appTx.reference && bankTx.reference === appTx.reference) {
      confidence += 0.1
      reasons.push('Referência idêntica')
    }

    return { confidence, reasons }
  }

  private calculateFuzzyMatch(bankTx: BankTransaction, appTx: any): { confidence: number; reasons: string[] } {
    const reasons: string[] = []
    let confidence = 0

    // Amount match with tolerance
    const amountDiff = Math.abs(bankTx.amount - appTx.amount)
    const amountTolerance = Math.max(Math.abs(bankTx.amount) * 0.02, 1) // 2% or R$1
    if (amountDiff <= amountTolerance) {
      confidence += 0.35
      reasons.push(`Valor próximo (diferença: R$${amountDiff.toFixed(2)})`)
    }

    // Date match with tolerance (within 3 days)
    const dateDiff = Math.abs(bankTx.date.getTime() - new Date(appTx.date).getTime())
    const daysDiff = dateDiff / (24 * 60 * 60 * 1000)
    if (daysDiff <= 3) {
      confidence += 0.25 * (1 - daysDiff / 3)
      reasons.push(`Data próxima (${daysDiff.toFixed(1)} dias)`)
    }

    // Description similarity
    const descSimilarity = this.calculateTextSimilarity(
      bankTx.description.toLowerCase(),
      appTx.description?.toLowerCase() || ''
    )
    if (descSimilarity >= 0.5) {
      confidence += 0.2 * descSimilarity
      reasons.push(`Descrição similar (${(descSimilarity * 100).toFixed(0)}%)`)
    }

    // Merchant name similarity
    if (bankTx.merchantName && appTx.merchantName) {
      const merchantSimilarity = this.calculateTextSimilarity(
        bankTx.merchantName.toLowerCase(),
        appTx.merchantName.toLowerCase()
      )
      if (merchantSimilarity >= 0.7) {
        confidence += 0.15
        reasons.push('Estabelecimento similar')
      }
    }

    // Transaction type match
    if (bankTx.type === appTx.type) {
      confidence += 0.05
      reasons.push('Tipo de transação compatível')
    }

    return { confidence, reasons }
  }

  private async detectDuplicates(bankTransactions: BankTransaction[], appTransactions: any[]): Promise<void> {
    // Detect duplicates within bank transactions
    await this.detectDuplicatesInSet(bankTransactions, 'bank')
    
    // Detect duplicates within app transactions
    await this.detectDuplicatesInSet(appTransactions, 'app')
    
    // Detect potential duplicates between matched transactions
    await this.detectCrossSetDuplicates()
  }

  private async detectDuplicatesInSet(transactions: any[], source: 'bank' | 'app'): Promise<void> {
    const groups: any[][] = []

    for (let i = 0; i < transactions.length; i++) {
      const tx1 = transactions[i]
      const duplicates = [tx1]

      for (let j = i + 1; j < transactions.length; j++) {
        const tx2 = transactions[j]
        const similarity = this.calculateDuplicateSimilarity(tx1, tx2)
        
        if (similarity >= 0.9) {
          duplicates.push(tx2)
        }
      }

      if (duplicates.length > 1) {
        groups.push(duplicates)
        // Remove found duplicates from further processing
        duplicates.slice(1).forEach(dup => {
          const index = transactions.indexOf(dup)
          if (index > i) transactions.splice(index, 1)
        })
      }
    }

    // Create duplicate groups
    groups.forEach(group => {
      const duplicateGroup: DuplicateGroup = {
        id: this.generateDuplicateId(),
        transactions: group,
        duplicateType: 'exact',
        confidence: 0.95,
        suggestedAction: source === 'bank' ? 'keep_bank' : 'keep_app',
        createdAt: new Date()
      }

      this.duplicateGroups.set(duplicateGroup.id, duplicateGroup)
    })
  }

  private async detectCrossSetDuplicates(): Promise<void> {
    // This would detect cases where the same transaction appears in both bank and app
    // but wasn't matched due to slight differences
    const matches = Array.from(this.matches.values())
    
    matches.forEach(match => {
      if (match.confidence < 0.8 && match.matchType === 'fuzzy') {
        // This might be a duplicate rather than a match
        const duplicateGroup: DuplicateGroup = {
          id: this.generateDuplicateId(),
          transactions: [match.bankTransaction, match.appTransaction],
          duplicateType: 'potential',
          confidence: match.confidence,
          suggestedAction: 'merge',
          createdAt: new Date()
        }

        this.duplicateGroups.set(duplicateGroup.id, duplicateGroup)
      }
    })
  }

  private calculateDuplicateSimilarity(tx1: any, tx2: any): number {
    let similarity = 0

    // Exact amount match
    if (Math.abs(tx1.amount - tx2.amount) < 0.01) {
      similarity += 0.4
    }

    // Exact date match
    const date1 = tx1.date instanceof Date ? tx1.date : new Date(tx1.date)
    const date2 = tx2.date instanceof Date ? tx2.date : new Date(tx2.date)
    if (Math.abs(date1.getTime() - date2.getTime()) < 60000) { // Within 1 minute
      similarity += 0.3
    }

    // Description similarity
    const descSim = this.calculateTextSimilarity(
      tx1.description?.toLowerCase() || '',
      tx2.description?.toLowerCase() || ''
    )
    similarity += descSim * 0.3

    return similarity
  }

  private async identifyConflicts(): Promise<void> {
    const matches = Array.from(this.matches.values()).filter(m => m.appTransaction)

    matches.forEach(match => {
      const conflicts = this.findTransactionConflicts(match.bankTransaction, match.appTransaction)
      
      conflicts.forEach(conflict => {
        this.conflicts.set(conflict.id, conflict)
      })
    })
  }

  private findTransactionConflicts(bankTx: BankTransaction, appTx: any): ReconciliationConflict[] {
    const conflicts: ReconciliationConflict[] = []

    // Amount conflict
    if (Math.abs(bankTx.amount - appTx.amount) > 0.01) {
      conflicts.push({
        id: this.generateConflictId(),
        bankTransaction: bankTx,
        appTransaction: appTx,
        conflictType: 'amount',
        bankValue: bankTx.amount,
        appValue: appTx.amount,
        suggestedResolution: 'use_bank',
        confidence: 0.9,
        createdAt: new Date()
      })
    }

    // Date conflict (more than 1 day difference)
    const dateDiff = Math.abs(bankTx.date.getTime() - new Date(appTx.date).getTime())
    if (dateDiff > 24 * 60 * 60 * 1000) {
      conflicts.push({
        id: this.generateConflictId(),
        bankTransaction: bankTx,
        appTransaction: appTx,
        conflictType: 'date',
        bankValue: bankTx.date,
        appValue: appTx.date,
        suggestedResolution: 'use_bank',
        confidence: 0.8,
        createdAt: new Date()
      })
    }

    // Category conflict
    if (bankTx.category && appTx.category && bankTx.category !== appTx.category) {
      conflicts.push({
        id: this.generateConflictId(),
        bankTransaction: bankTx,
        appTransaction: appTx,
        conflictType: 'category',
        bankValue: bankTx.category,
        appValue: appTx.category,
        suggestedResolution: 'manual_review',
        confidence: 0.6,
        createdAt: new Date()
      })
    }

    return conflicts
  }

  private async categorizeBankTransactions(bankTransactions: BankTransaction[]): Promise<void> {
    const unmatchedBank = bankTransactions.filter(bt => !this.isTransactionMatched(bt.id, 'bank'))

    for (const bankTx of unmatchedBank) {
      try {
        const classification = await smartCategorization.categorizeTransaction(bankTx)
        
        // Apply category if confidence is high enough
        if (classification.confidence >= 0.7) {
          bankTx.category = classification.suggestedCategory
        }
      } catch (error) {
        console.error('Failed to categorize bank transaction:', error)
      }
    }
  }

  // Helper methods
  private isTransactionMatched(transactionId: string, source: 'bank' | 'app'): boolean {
    return Array.from(this.matches.values()).some(match => {
      if (source === 'bank') {
        return match.bankTransaction.id === transactionId
      } else {
        return match.appTransaction?.id === transactionId
      }
    })
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0

    const words1 = text1.split(/\s+/).filter(w => w.length > 2)
    const words2 = text2.split(/\s+/).filter(w => w.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const commonWords = words1.filter(word => words2.includes(word))
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  private generateSummary(bankTransactions: BankTransaction[], appTransactions: any[]): ReconciliationSummary {
    const matched = Array.from(this.matches.values()).filter(m => m.status === 'matched').length
    const conflicts = this.conflicts.size
    const duplicates = this.duplicateGroups.size
    const unmatched = bankTransactions.length + appTransactions.length - (matched * 2)

    return {
      totalBankTransactions: bankTransactions.length,
      totalAppTransactions: appTransactions.length,
      matched,
      unmatched,
      conflicts,
      duplicates,
      accuracy: bankTransactions.length > 0 ? matched / bankTransactions.length : 0,
      lastReconciliation: new Date()
    }
  }

  // Public API methods
  getMatches(): ReconciliationMatch[] {
    return Array.from(this.matches.values())
  }

  getConflicts(): ReconciliationConflict[] {
    return Array.from(this.conflicts.values())
  }

  getDuplicateGroups(): DuplicateGroup[] {
    return Array.from(this.duplicateGroups.values())
  }

  resolveConflict(conflictId: string, resolution: 'use_bank' | 'use_app' | 'merge' | 'ignore'): void {
    const conflict = this.conflicts.get(conflictId)
    if (conflict) {
      conflict.resolution = resolution
      conflict.resolvedAt = new Date()
      this.saveReconciliationData()
    }
  }

  resolveDuplicate(duplicateId: string, resolution: string): void {
    const duplicate = this.duplicateGroups.get(duplicateId)
    if (duplicate) {
      duplicate.resolution = resolution
      duplicate.resolvedAt = new Date()
      this.saveReconciliationData()
    }
  }

  // ID generators
  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateDuplicateId(): string {
    return `duplicate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const dataReconciliation = DataReconciliation.getInstance()
