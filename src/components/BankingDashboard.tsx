'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'
import { bankingIntegration, BankConnection, OpenBankingProvider } from '@/lib/banking-integration'
import { dataReconciliation } from '@/lib/data-reconciliation'
import { smartCategorization } from '@/lib/smart-categorization'

interface BankingDashboardProps {
  onTransactionSync?: (transactions: any[]) => void
}

export function BankingDashboard({ onTransactionSync }: BankingDashboardProps) {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [providers, setProviders] = useState<OpenBankingProvider[]>([])
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: 'idle' | 'syncing' | 'success' | 'error' }>({})
  const [reconciliationSummary, setReconciliationSummary] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'connections' | 'reconciliation' | 'categories'>('connections')

  useEffect(() => {
    loadBankingData()
  }, [])

  const loadBankingData = async () => {
    setLoading(true)
    try {
      const bankProviders = bankingIntegration.getProviders()
      const bankConnections = bankingIntegration.getConnections()
      
      setProviders(bankProviders)
      setConnections(bankConnections)
    } catch (error) {
      console.error('Failed to load banking data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectBank = async (bankCode: string) => {
    try {
      setLoading(true)
      const authUrl = await bankingIntegration.initiateConnection(bankCode)
      window.location.href = authUrl
    } catch (error) {
      console.error('Failed to initiate bank connection:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAccount = async (connectionId: string, accountId: string) => {
    setSyncStatus(prev => ({ ...prev, [accountId]: 'syncing' }))
    
    try {
      const transactions = await bankingIntegration.syncTransactions(accountId)
      
      if (onTransactionSync) {
        onTransactionSync(transactions)
      }
      
      setSyncStatus(prev => ({ ...prev, [accountId]: 'success' }))
      
      // Auto-hide success status after 3 seconds
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [accountId]: 'idle' }))
      }, 3000)
      
    } catch (error) {
      console.error('Failed to sync account:', error)
      setSyncStatus(prev => ({ ...prev, [accountId]: 'error' }))
    }
  }

  const handleDisconnectBank = async (connectionId: string) => {
    if (confirm('Tem certeza que deseja desconectar este banco?')) {
      try {
        await bankingIntegration.disconnectBank(connectionId)
        await loadBankingData()
      } catch (error) {
        console.error('Failed to disconnect bank:', error)
      }
    }
  }

  const handleReconciliation = async () => {
    setLoading(true)
    try {
      // Get all bank transactions
      const allBankTransactions: any[] = []
      for (const connection of connections) {
        for (const account of connection.accounts) {
          const transactions = await bankingIntegration.syncTransactions(account.id)
          allBankTransactions.push(...transactions)
        }
      }

      // Get app transactions (mock for now)
      const appTransactions: any[] = []

      // Run reconciliation
      const summary = await dataReconciliation.reconcileTransactions(allBankTransactions, appTransactions)
      setReconciliationSummary(summary)
      
    } catch (error) {
      console.error('Failed to run reconciliation:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing': return '🔄'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '📊'
    }
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'syncing': return isDark ? 'text-blue-400' : 'text-blue-600'
      case 'success': return isDark ? 'text-green-400' : 'text-green-600'
      case 'error': return isDark ? 'text-red-400' : 'text-red-600'
      default: return isDark ? 'text-gray-400' : 'text-gray-600'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading && connections.length === 0) {
    return (
      <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Carregando integração bancária...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🏦 Integração Bancária
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Conecte suas contas bancárias para sincronização automática
            </p>
          </div>
          {connections.length > 0 && (
            <button
              onClick={handleReconciliation}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
              }`}
            >
              {loading ? 'Reconciliando...' : 'Reconciliar Dados'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'connections', label: 'Conexões', count: connections.length },
          { key: 'reconciliation', label: 'Reconciliação', count: reconciliationSummary?.conflicts || 0 },
          { key: 'categories', label: 'Categorização', count: smartCategorization.getRules().length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? isDark 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/10'
                  : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : isDark
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-800'
                  : isDark
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'connections' && (
          <div className="space-y-6">
            {/* Connected Banks */}
            {connections.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Bancos Conectados
                </h3>
                <div className="space-y-4">
                  {connections.map(connection => (
                    <div
                      key={connection.id}
                      className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {connection.bankName.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {connection.bankName}
                            </h4>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {connection.accounts.length} conta(s) • 
                              Status: {connection.status === 'connected' ? 'Conectado' : 'Erro'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDisconnectBank(connection.id)}
                          className={`text-sm px-3 py-1 rounded transition-colors ${
                            isDark
                              ? 'text-red-400 hover:bg-red-900/20'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          Desconectar
                        </button>
                      </div>

                      {/* Accounts */}
                      <div className="space-y-2">
                        {connection.accounts.map(account => (
                          <div
                            key={account.id}
                            className={`flex items-center justify-between p-3 rounded border ${
                              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div>
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {account.accountType === 'checking' ? 'Conta Corrente' :
                                 account.accountType === 'savings' ? 'Poupança' : 'Cartão de Crédito'}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                ****{account.accountNumber.slice(-4)} • {formatCurrency(account.balance)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleSyncAccount(connection.id, account.id)}
                              disabled={syncStatus[account.id] === 'syncing'}
                              className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                                isDark
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
                              }`}
                            >
                              <span>{getSyncStatusIcon(syncStatus[account.id] || 'idle')}</span>
                              <span>
                                {syncStatus[account.id] === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Banks */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Bancos Disponíveis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.filter(p => !connections.some(c => c.bankCode === p.code)).map(provider => (
                  <div
                    key={provider.code}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleConnectBank(provider.code)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {provider.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {provider.name}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {provider.supportedFeatures.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            {reconciliationSummary ? (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Resumo da Reconciliação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {reconciliationSummary.matched}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      Transações Reconciliadas
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {reconciliationSummary.conflicts}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Conflitos Encontrados
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {reconciliationSummary.duplicates}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                      Duplicatas Detectadas
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {Math.round(reconciliationSummary.accuracy * 100)}%
                    </div>
                    <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      Taxa de Precisão
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔄</div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Execute a reconciliação para ver o resumo dos dados
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Regras de Categorização
              </h3>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Sistema de categorização inteligente ativo com {smartCategorization.getRules().length} regras configuradas.
                  As transações bancárias são automaticamente categorizadas com base em padrões aprendidos.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
