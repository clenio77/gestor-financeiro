'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import ClientOnly from '@/components/ClientOnly'
import { IntelligentInsights } from '@/components/IntelligentInsights'
import { usePredictiveAnalysis } from '@/hooks/usePredictiveAnalysis'
import { useFinancialGoals } from '@/hooks/useFinancialData'
import { useTheme } from '@/components/ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'

// Disable SSG for this page to avoid theme provider issues
export const dynamic = 'force-dynamic'

export default function AnalyticsPage() {
  return (
    <AuthLayout title="🧠 Análise Preditiva">
      <ClientOnly fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">
            Carregando análise inteligente...
          </span>
        </div>
      }>
        <AnalyticsContent />
      </ClientOnly>
    </AuthLayout>
  )
}

function AnalyticsContent() {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const { goals, loading: dataLoading } = useFinancialGoals()

  // Mock data for now - in a real app, these would come from proper hooks
  const transactions: any[] = []
  const budgets: any[] = []
  const accounts: any[] = []
  const { 
    analysisData, 
    loading: analysisLoading, 
    error,
    getCashFlowTrend,
    getTopSavingsOpportunities,
    getRiskLevel,
    runAnalysis
  } = usePredictiveAnalysis(transactions, goals, budgets, accounts)

  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('3M')

  const loading = dataLoading || analysisLoading

  const handleInsightAction = (insight: any, action: string) => {
    console.log('Insight action:', insight, action)
    // TODO: Implement specific actions based on insight type
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return isDark ? 'text-red-400' : 'text-red-600'
      case 'medium': return isDark ? 'text-yellow-400' : 'text-yellow-600'
      case 'low': return isDark ? 'text-green-400' : 'text-green-600'
    }
  }

  const getRiskBgColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'
      case 'medium': return isDark ? 'bg-yellow-900/20 border-yellow-500' : 'bg-yellow-50 border-yellow-200'
      case 'low': return isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className={`ml-4 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Processando análise inteligente...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'}`}>
        <h3 className={`font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          Erro na Análise
        </h3>
        <p className={`${isDark ? 'text-red-300' : 'text-red-700'}`}>
          {error}
        </p>
        <button
          onClick={runAnalysis}
          className={`mt-4 px-4 py-2 rounded-lg transition-colors ${
            isDark
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cash Flow Prediction */}
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Fluxo Próximo Mês
                </p>
                <p className={`text-xl font-bold ${
                  (analysisData?.cashFlowForecast.nextMonth.netCashFlow || 0) >= 0
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : isDark ? 'text-red-400' : 'text-red-600'
                }`}>
                  {analysisData?.cashFlowForecast?.nextMonth?.netCashFlow !== undefined
                    ? formatCurrency(analysisData.cashFlowForecast.nextMonth.netCashFlow)
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
            <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Confiança: {Math.round((analysisData?.cashFlowForecast?.nextMonth?.confidence || 0) * 100)}%
            </div>
          </div>

          {/* Savings Opportunities */}
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Economia Potencial
                </p>
                <p className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {getTopSavingsOpportunities(1)[0]?.potentialSavings 
                    ? formatCurrency(getTopSavingsOpportunities(1)[0].potentialSavings)
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
            <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {getTopSavingsOpportunities().length} oportunidades
            </div>
          </div>

          {/* Risk Assessment */}
          <div className={`p-4 rounded-lg border ${getRiskBgColor(getRiskLevel())}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nível de Risco
                </p>
                <p className={`text-xl font-bold ${getRiskColor(getRiskLevel())}`}>
                  {getRiskLevel() === 'low' ? 'Baixo' : 
                   getRiskLevel() === 'medium' ? 'Médio' : 'Alto'}
                </p>
              </div>
              <div className="text-2xl">
                {getRiskLevel() === 'low' ? '✅' : 
                 getRiskLevel() === 'medium' ? '⚠️' : '🚨'}
              </div>
            </div>
            <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {analysisData?.riskAssessment?.riskFactors?.length || 0} fatores identificados
            </div>
          </div>

          {/* AI Confidence */}
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Confiança da IA
                </p>
                <p className={`text-xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  85%
                </p>
              </div>
              <div className="text-2xl">🤖</div>
            </div>
            <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {analysisData?.insights.length || 0} insights gerados
            </div>
          </div>
        </div>

        {/* Cash Flow Forecast Chart */}
        {analysisData?.cashFlowForecast && (
          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              📊 Previsão de Fluxo de Caixa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Próximo Mês
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Receita Prevista:</span>
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(analysisData.cashFlowForecast.nextMonth.predictedIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gastos Previstos:</span>
                    <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {formatCurrency(analysisData.cashFlowForecast.nextMonth.predictedExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Saldo Líquido:</span>
                    <span className={`font-bold ${
                      analysisData.cashFlowForecast.nextMonth.netCashFlow >= 0
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCurrency(analysisData.cashFlowForecast.nextMonth.netCashFlow)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Próximos 3 Meses
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Receita Prevista:</span>
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(analysisData.cashFlowForecast.next3Months.predictedIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gastos Previstos:</span>
                    <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {formatCurrency(analysisData.cashFlowForecast.next3Months.predictedExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Saldo Líquido:</span>
                    <span className={`font-bold ${
                      analysisData.cashFlowForecast.next3Months.netCashFlow >= 0
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCurrency(analysisData.cashFlowForecast.next3Months.netCashFlow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Savings Opportunities */}
        {getTopSavingsOpportunities().length > 0 && (
          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              💡 Oportunidades de Economia
            </h3>
            <div className="space-y-4">
              {getTopSavingsOpportunities().map((opportunity, index) => (
                <div
                  key={opportunity.id}
                  className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {opportunity.category}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        opportunity.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        opportunity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {opportunity.difficulty === 'easy' ? 'Fácil' :
                         opportunity.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </span>
                      <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {formatCurrency(opportunity.potentialSavings)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.suggestions.map((suggestion, suggestionIndex) => (
                      <span
                        key={suggestionIndex}
                        className={`text-xs px-2 py-1 rounded-full ${
                          isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intelligent Insights Component */}
        <IntelligentInsights
          transactions={transactions}
          goals={goals}
          budgets={budgets}
          onInsightAction={handleInsightAction}
        />

        {/* Risk Assessment */}
        {analysisData?.riskAssessment && (
          <div className={`p-6 rounded-lg border ${getRiskBgColor(analysisData.riskAssessment.overallRisk)}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🛡️ Avaliação de Riscos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Métricas de Risco
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Comprometimento da Renda:</span>
                    <span className={`font-medium ${getRiskColor(
                      analysisData.riskAssessment.debtToIncomeRatio > 0.8 ? 'high' :
                      analysisData.riskAssessment.debtToIncomeRatio > 0.6 ? 'medium' : 'low'
                    )}`}>
                      {Math.round(analysisData.riskAssessment.debtToIncomeRatio * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Volatilidade dos Gastos:</span>
                    <span className={`font-medium ${getRiskColor(
                      analysisData.riskAssessment.spendingVolatility > 0.3 ? 'high' :
                      analysisData.riskAssessment.spendingVolatility > 0.2 ? 'medium' : 'low'
                    )}`}>
                      {Math.round(analysisData.riskAssessment.spendingVolatility * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reserva Recomendada:</span>
                    <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {formatCurrency(analysisData.riskAssessment.emergencyFundRecommendation)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fatores de Risco
                </h4>
                <div className="space-y-2">
                  {analysisData.riskAssessment.riskFactors.length === 0 ? (
                    <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      ✅ Nenhum fator de risco crítico identificado
                    </p>
                  ) : (
                    analysisData.riskAssessment.riskFactors.map((factor, index) => (
                      <div key={index} className="text-sm">
                        <div className={`font-medium ${getRiskColor(factor.severity)}`}>
                          {factor.description}
                        </div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          💡 {factor.recommendation}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}
