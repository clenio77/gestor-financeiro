'use client'

import { useState, useEffect } from 'react'
import { mlEngine, PersonalizedInsight, FinancialAnomaly, SpendingPrediction } from '@/lib/ml-engine'
import { useTheme } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'

interface IntelligentInsightsProps {
  transactions: any[]
  goals: any[]
  budgets: any[]
  onInsightAction?: (insight: PersonalizedInsight, action: string) => void
}

export function IntelligentInsights({ 
  transactions, 
  goals, 
  budgets, 
  onInsightAction 
}: IntelligentInsightsProps) {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [insights, setInsights] = useState<PersonalizedInsight[]>([])
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([])
  const [predictions, setPredictions] = useState<SpendingPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'insights' | 'anomalies' | 'predictions'>('insights')

  useEffect(() => {
    analyzeData()
  }, [transactions, goals, budgets])

  const analyzeData = async () => {
    setLoading(true)
    
    try {
      // Generate insights
      const generatedInsights = mlEngine.generateInsights(transactions, goals, budgets)
      setInsights(generatedInsights)

      // Detect anomalies
      const detectedAnomalies = mlEngine.detectAnomalies(transactions)
      setAnomalies(detectedAnomalies)

      // Generate predictions for main categories
      const patterns = mlEngine.analyzeTransactionPatterns(transactions)
      const generatedPredictions: SpendingPrediction[] = []
      
      patterns.slice(0, 5).forEach(pattern => {
        const prediction = mlEngine.predictSpending(pattern.category, 'monthly')
        if (prediction) {
          generatedPredictions.push(prediction)
        }
      })
      
      setPredictions(generatedPredictions)
    } catch (error) {
      console.error('Error analyzing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInsightAction = (insight: PersonalizedInsight, action: string) => {
    if (onInsightAction) {
      onInsightAction(insight, action)
    }
  }

  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'high': return isDark ? 'text-red-400' : 'text-red-600'
      case 'medium': return isDark ? 'text-yellow-400' : 'text-yellow-600'
      case 'low': return isDark ? 'text-green-400' : 'text-green-600'
    }
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'
      case 'medium': return isDark ? 'bg-yellow-900/20 border-yellow-500' : 'bg-yellow-50 border-yellow-200'
      case 'low': return isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200'
    }
  }

  const getConfidenceBar = (confidence: number) => {
    const percentage = Math.round(confidence * 100)
    const color = confidence > 0.8 ? 'bg-green-500' : confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
    
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-16 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div 
            className={`h-full rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {percentage}%
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Analisando seus dados financeiros...
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
              🧠 Insights Inteligentes
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Análise baseada em IA dos seus padrões financeiros
            </p>
          </div>
          <div className="text-right">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Confiança da IA
            </div>
            {getConfidenceBar(0.85)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'insights', label: 'Insights', count: insights.length },
          { key: 'anomalies', label: 'Anomalias', count: anomalies.length },
          { key: 'predictions', label: 'Previsões', count: predictions.length }
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
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🤖</div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ainda não há insights suficientes. Continue usando o app para gerar análises personalizadas.
                </p>
              </div>
            ) : (
              insights.map(insight => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {insight.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)} ${
                          isDark ? 'bg-gray-800' : 'bg-white'
                        }`}>
                          {insight.impact === 'high' ? 'Alto Impacto' : 
                           insight.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {insight.description}
                      </p>
                      {insight.potentialSavings && (
                        <div className={`text-sm font-medium mb-3 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          💰 Economia potencial: R$ {insight.potentialSavings.toFixed(2)}
                        </div>
                      )}
                      {insight.actionable && insight.actions && (
                        <div className="space-y-2">
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Ações recomendadas:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {insight.actions.map((action, index) => (
                              <button
                                key={index}
                                onClick={() => handleInsightAction(insight, action)}
                                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                  isDark
                                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {getConfidenceBar(insight.confidence)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            {anomalies.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nenhuma anomalia detectada nos seus gastos recentes. Parabéns!
                </p>
              </div>
            ) : (
              anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">
                          {anomaly.type === 'unusual_amount' ? '💰' :
                           anomaly.type === 'unusual_frequency' ? '📊' :
                           anomaly.type === 'unusual_category' ? '🏷️' : '⏰'}
                        </span>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {anomaly.description}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                          anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {anomaly.severity === 'high' ? 'Alta' : 
                           anomaly.severity === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      {anomaly.suggestedAction && (
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          💡 {anomaly.suggestedAction}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        {anomaly.relatedTransactions.length} transação(ões) relacionada(s)
                      </div>
                    </div>
                    <div className="ml-4">
                      {getConfidenceBar(anomaly.confidence)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-4">
            {predictions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔮</div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Dados insuficientes para gerar previsões. Continue registrando transações.
                </p>
              </div>
            ) : (
              predictions.map((prediction, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      📈 {prediction.category}
                    </h3>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        R$ {prediction.predictedAmount.toFixed(2)}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        próximo mês
                      </div>
                    </div>
                  </div>
                  
                  {prediction.factors.length > 0 && (
                    <div className="mb-3">
                      <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Fatores considerados:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {prediction.factors.map((factor, factorIndex) => (
                          <span
                            key={factorIndex}
                            className={`text-xs px-2 py-1 rounded-full ${
                              isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {prediction.recommendation && (
                    <div className={`text-sm p-3 rounded ${
                      isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      💡 {prediction.recommendation}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Confiança da previsão
                    </span>
                    {getConfidenceBar(prediction.confidence)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
