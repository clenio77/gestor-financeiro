// Banking Integration System for Open Banking
import { cacheManager } from './cache-manager'

export interface BankAccount {
  id: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountType: 'checking' | 'savings' | 'credit'
  balance: number
  currency: string
  lastSync: Date
  isActive: boolean
  permissions: BankPermission[]
}

export interface BankPermission {
  type: 'balance' | 'transactions' | 'account_info' | 'payments'
  granted: boolean
  expiresAt: Date
}

export interface BankTransaction {
  id: string
  accountId: string
  amount: number
  currency: string
  description: string
  date: Date
  type: 'debit' | 'credit'
  category?: string
  merchantName?: string
  merchantCategory?: string
  location?: string
  reference?: string
  status: 'pending' | 'completed' | 'failed'
  metadata: Record<string, any>
}

export interface BankConnection {
  id: string
  bankCode: string
  bankName: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
  lastSync?: Date
  errorMessage?: string
  accounts: BankAccount[]
}

export interface OpenBankingProvider {
  code: string
  name: string
  logo: string
  supportedFeatures: string[]
  authUrl: string
  apiBaseUrl: string
  isActive: boolean
}

class BankingIntegration {
  private static instance: BankingIntegration
  private connections: Map<string, BankConnection> = new Map()
  private providers: OpenBankingProvider[] = []
  private encryptionKey: string = ''

  private constructor() {
    this.initializeProviders()
    this.loadConnections()
    this.setupEncryption()
  }

  static getInstance(): BankingIntegration {
    if (!BankingIntegration.instance) {
      BankingIntegration.instance = new BankingIntegration()
    }
    return BankingIntegration.instance
  }

  private initializeProviders(): void {
    // Brazilian banks with Open Banking support
    this.providers = [
      {
        code: 'bb',
        name: 'Banco do Brasil',
        logo: '/banks/bb.png',
        supportedFeatures: ['balance', 'transactions', 'pix'],
        authUrl: 'https://oauth.bb.com.br/oauth/authorize',
        apiBaseUrl: 'https://api.bb.com.br/open-banking/v1',
        isActive: true
      },
      {
        code: 'itau',
        name: 'Itaú Unibanco',
        logo: '/banks/itau.png',
        supportedFeatures: ['balance', 'transactions', 'payments'],
        authUrl: 'https://devportal.itau.com.br/oauth/authorize',
        apiBaseUrl: 'https://api.itau.com.br/open-banking/v1',
        isActive: true
      },
      {
        code: 'bradesco',
        name: 'Bradesco',
        logo: '/banks/bradesco.png',
        supportedFeatures: ['balance', 'transactions'],
        authUrl: 'https://proxy.api.prebanco.com.br/oauth/authorize',
        apiBaseUrl: 'https://proxy.api.prebanco.com.br/open-banking/v1',
        isActive: true
      },
      {
        code: 'santander',
        name: 'Santander',
        logo: '/banks/santander.png',
        supportedFeatures: ['balance', 'transactions', 'investments'],
        authUrl: 'https://developer.santander.com.br/oauth/authorize',
        apiBaseUrl: 'https://api.santander.com.br/open-banking/v1',
        isActive: true
      },
      {
        code: 'nubank',
        name: 'Nubank',
        logo: '/banks/nubank.png',
        supportedFeatures: ['balance', 'transactions', 'credit_card'],
        authUrl: 'https://prod-s0-webapp-proxy.nubank.com.br/oauth/authorize',
        apiBaseUrl: 'https://prod-s0-webapp-proxy.nubank.com.br/api',
        isActive: true
      },
      {
        code: 'inter',
        name: 'Banco Inter',
        logo: '/banks/inter.png',
        supportedFeatures: ['balance', 'transactions', 'pix', 'investments'],
        authUrl: 'https://cdpj.partners.bancointer.com.br/oauth/authorize',
        apiBaseUrl: 'https://cdpj.partners.bancointer.com.br/openbanking/v1',
        isActive: true
      }
    ]
  }

  private loadConnections(): void {
    try {
      const stored = localStorage.getItem('bank_connections')
      if (stored) {
        const connections = JSON.parse(stored)
        connections.forEach((conn: BankConnection) => {
          this.connections.set(conn.id, conn)
        })
      }
    } catch (error) {
      console.error('Failed to load bank connections:', error)
    }
  }

  private saveConnections(): void {
    try {
      const connections = Array.from(this.connections.values())
      localStorage.setItem('bank_connections', JSON.stringify(connections))
    } catch (error) {
      console.error('Failed to save bank connections:', error)
    }
  }

  private setupEncryption(): void {
    // In production, this should be properly managed
    this.encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key'
  }

  // Public API methods
  getProviders(): OpenBankingProvider[] {
    return this.providers.filter(p => p.isActive)
  }

  getConnections(): BankConnection[] {
    return Array.from(this.connections.values())
  }

  getConnection(bankCode: string): BankConnection | undefined {
    return Array.from(this.connections.values()).find(c => c.bankCode === bankCode)
  }

  async initiateConnection(bankCode: string): Promise<string> {
    const provider = this.providers.find(p => p.code === bankCode)
    if (!provider) {
      throw new Error(`Bank provider ${bankCode} not found`)
    }

    // Generate state for OAuth security
    const state = this.generateState()
    const redirectUri = `${window.location.origin}/banking/callback`
    
    const authUrl = new URL(provider.authUrl)
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_BANKING_CLIENT_ID || '')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'accounts transactions')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)

    // Store state for validation
    sessionStorage.setItem(`banking_state_${bankCode}`, state)

    return authUrl.toString()
  }

  async completeConnection(bankCode: string, authCode: string, state: string): Promise<BankConnection> {
    // Validate state
    const storedState = sessionStorage.getItem(`banking_state_${bankCode}`)
    if (storedState !== state) {
      throw new Error('Invalid state parameter')
    }

    const provider = this.providers.find(p => p.code === bankCode)
    if (!provider) {
      throw new Error(`Bank provider ${bankCode} not found`)
    }

    try {
      // Exchange auth code for access token
      const tokenResponse = await this.exchangeCodeForToken(provider, authCode)
      
      // Create connection
      const connection: BankConnection = {
        id: this.generateConnectionId(),
        bankCode,
        bankName: provider.name,
        status: 'connected',
        accessToken: this.encrypt(tokenResponse.access_token),
        refreshToken: tokenResponse.refresh_token ? this.encrypt(tokenResponse.refresh_token) : undefined,
        tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        lastSync: new Date(),
        accounts: []
      }

      // Fetch accounts
      await this.syncAccounts(connection)

      this.connections.set(connection.id, connection)
      this.saveConnections()

      return connection
    } catch (error) {
      console.error('Failed to complete bank connection:', error)
      throw error
    }
  }

  async syncAccounts(connection: BankConnection): Promise<void> {
    const provider = this.providers.find(p => p.code === connection.bankCode)
    if (!provider) return

    try {
      const accessToken = this.decrypt(connection.accessToken!)
      const response = await fetch(`${provider.apiBaseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`)
      }

      const data = await response.json()
      const accounts: BankAccount[] = data.accounts.map((acc: any) => ({
        id: acc.accountId,
        bankCode: connection.bankCode,
        bankName: connection.bankName,
        accountNumber: acc.number,
        accountType: this.mapAccountType(acc.type),
        balance: acc.balance.amount,
        currency: acc.balance.currency,
        lastSync: new Date(),
        isActive: true,
        permissions: this.mapPermissions(acc.permissions)
      }))

      connection.accounts = accounts
      connection.lastSync = new Date()
      connection.status = 'connected'

      this.saveConnections()
    } catch (error) {
      console.error('Failed to sync accounts:', error)
      connection.status = 'error'
      connection.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.saveConnections()
    }
  }

  async syncTransactions(accountId: string, fromDate?: Date): Promise<BankTransaction[]> {
    const connection = this.findConnectionByAccountId(accountId)
    if (!connection) {
      throw new Error('Connection not found for account')
    }

    const provider = this.providers.find(p => p.code === connection.bankCode)
    if (!provider) {
      throw new Error('Provider not found')
    }

    try {
      const accessToken = this.decrypt(connection.accessToken!)
      const url = new URL(`${provider.apiBaseUrl}/accounts/${accountId}/transactions`)
      
      if (fromDate) {
        url.searchParams.set('fromDate', fromDate.toISOString().split('T')[0])
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`)
      }

      const data = await response.json()
      const transactions: BankTransaction[] = data.transactions.map((tx: any) => ({
        id: tx.transactionId,
        accountId,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        date: new Date(tx.date),
        type: tx.amount > 0 ? 'credit' : 'debit',
        merchantName: tx.merchant?.name,
        merchantCategory: tx.merchant?.category,
        location: tx.location,
        reference: tx.reference,
        status: this.mapTransactionStatus(tx.status),
        metadata: tx.metadata || {}
      }))

      // Cache transactions
      await cacheManager.set(
        `transactions_${accountId}`,
        transactions,
        'api-data'
      )

      return transactions
    } catch (error) {
      console.error('Failed to sync transactions:', error)
      
      // Try to return cached transactions
      const cached = await cacheManager.get(`transactions_${accountId}`, 'api-data')
      return cached || []
    }
  }

  async refreshConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.refreshToken) {
      throw new Error('Connection not found or no refresh token available')
    }

    const provider = this.providers.find(p => p.code === connection.bankCode)
    if (!provider) {
      throw new Error('Provider not found')
    }

    try {
      const refreshToken = this.decrypt(connection.refreshToken)
      const response = await fetch(`${provider.apiBaseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.NEXT_PUBLIC_BANKING_CLIENT_ID || ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const tokenData = await response.json()
      connection.accessToken = this.encrypt(tokenData.access_token)
      if (tokenData.refresh_token) {
        connection.refreshToken = this.encrypt(tokenData.refresh_token)
      }
      connection.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

      this.saveConnections()
    } catch (error) {
      console.error('Failed to refresh connection:', error)
      connection.status = 'error'
      connection.errorMessage = 'Token refresh failed'
      this.saveConnections()
      throw error
    }
  }

  async disconnectBank(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      // Revoke tokens if possible
      const provider = this.providers.find(p => p.code === connection.bankCode)
      if (provider && connection.accessToken) {
        const accessToken = this.decrypt(connection.accessToken)
        await fetch(`${provider.apiBaseUrl}/oauth/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            token: accessToken,
            client_id: process.env.NEXT_PUBLIC_BANKING_CLIENT_ID || ''
          })
        })
      }
    } catch (error) {
      console.error('Failed to revoke tokens:', error)
    }

    this.connections.delete(connectionId)
    this.saveConnections()

    // Clear cached data
    connection.accounts.forEach(account => {
      cacheManager.invalidate(`transactions_${account.id}`, 'api-data')
    })
  }

  // Helper methods
  private async exchangeCodeForToken(provider: OpenBankingProvider, code: string): Promise<any> {
    const response = await fetch(`${provider.apiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.NEXT_PUBLIC_BANKING_CLIENT_ID || '',
        client_secret: process.env.NEXT_PUBLIC_BANKING_CLIENT_SECRET || '',
        redirect_uri: `${window.location.origin}/banking/callback`
      })
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    return response.json()
  }

  private findConnectionByAccountId(accountId: string): BankConnection | undefined {
    return Array.from(this.connections.values()).find(conn =>
      conn.accounts.some(acc => acc.id === accountId)
    )
  }

  private mapAccountType(type: string): 'checking' | 'savings' | 'credit' {
    switch (type.toLowerCase()) {
      case 'conta_corrente':
      case 'checking':
        return 'checking'
      case 'conta_poupanca':
      case 'savings':
        return 'savings'
      case 'cartao_credito':
      case 'credit':
        return 'credit'
      default:
        return 'checking'
    }
  }

  private mapPermissions(permissions: any[]): BankPermission[] {
    return permissions.map(p => ({
      type: p.type,
      granted: p.granted,
      expiresAt: new Date(p.expiresAt)
    }))
  }

  private mapTransactionStatus(status: string): 'pending' | 'completed' | 'failed' {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return 'pending'
      case 'completed':
      case 'concluido':
        return 'completed'
      case 'failed':
      case 'falhou':
        return 'failed'
      default:
        return 'completed'
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private encrypt(data: string): string {
    // Simple encryption - in production use proper encryption
    return btoa(data + this.encryptionKey)
  }

  private decrypt(encryptedData: string): string {
    // Simple decryption - in production use proper decryption
    const decoded = atob(encryptedData)
    return decoded.replace(this.encryptionKey, '')
  }
}

// Export singleton instance
export const bankingIntegration = BankingIntegration.getInstance()
