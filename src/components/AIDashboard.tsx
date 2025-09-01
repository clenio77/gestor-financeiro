'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'
import { aiAdvisor, UserProfile, AIRecommendation } from '@/lib/ai-advisor'
import { predictiveAnalytics, Prediction, MarketTrend, InvestmentRecommendation } from '@/lib/predictive-analytics'
import { AIAssistant } from './AIAssistant'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  PieChart,
  LineChart,
  Bot,
  Lightbulb,
  Shield,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  MessageCircle
} from 'lucide-react'

interface AIDashboardProps {
  transactions?: any[]
  goals?: any[]
  userProfile?: UserProfile
}

export function AIDashboard({ transactions = [], goals = [], userProfile }: AIDashboardProps) {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [investmentRecs, setInvestmentRecs] = useState<InvestmentRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'market' | 'investments'>('overview')
  const [showAssistant, setShowAssistant] = useState(false)
  const [riskAssessment, setRiskAssessment] = useState<any>(null)

  useEffect(() => {
    loadAIData()
  }, [transactions, goals, userProfile])

  const loadAIData = async () => {
    setLoading(true)
    try {
      // Load market trends
      const trends = predictiveAnalytics.getMarketTrends()
      setMarketTrends(trends)

      // Load recommendations
      const recs = aiAdvisor.getRecommendations()
      setRecommendations(recs)

      // Generate predictions if we have data
      if (transactions.length > 0) {
        const incomePrediction = await predictiveAnalytics.predictIncome(transactions)
        const expensePrediction = await predictiveAnalytics.predictExpenses(transactions)
        setPredictions([incomePrediction, expensePrediction])
      }

      // Generate investment recommendations
      if (userProfile) {
        const investRecs = await predictiveAnalytics.generateInvestmentRecommendations(userProfile, trends)
        setInvestmentRecs(investRecs)

        // Get risk assessment
        const risk = await aiAdvisor.assessFinancialRisk()
        setRiskAssessment(risk)
      }
    } catch (error) {
      console.error('Failed to load AI data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200'
      case 'down': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* AI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Recomendações Ativas
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {recommendations.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Lightbulb className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Score de Risco
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {riskAssessment ? Math.round(riskAssessment.riskScore) : '--'}
              </p>
            </div>
            <Shield className={`h-8 w-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Previsões Geradas
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {predictions.length}
              </p>
            </div>
            <BarChart3 className={`h-8 w-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Oportunidades
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {investmentRecs.length}
              </p>
            </div>
            <TrendingUp className={`h-8 w-8 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      {riskAssessment && (
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Análise de Risco Financeiro
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Object.entries(riskAssessment.riskFactors).map(([key, factor]: [string, any]) => (
              <div key={key} className={`p-3 rounded-lg border ${
                factor.level === 'low' 
                  ? 'bg-green-50 border-green-200' 
                  : factor.level === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    factor.level === 'low' 
                      ? 'text-green-800' 
                      : factor.level === 'medium'
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  }`}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    factor.level === 'low' 
                      ? 'bg-green-100 text-green-800' 
                      : factor.level === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {factor.score}
                  </span>
                </div>
                <p className={`text-xs ${
                  factor.level === 'low' 
                    ? 'text-green-700' 
                    : factor.level === 'medium'
                    ? 'text-yellow-700'
                    : 'text-red-700'
                }`}>
                  {factor.description}
                </p>
              </div>
            ))}
          </div>

          {riskAssessment.recommendations.length > 0 && (
            <div>
              <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recomendações de Risco:
              </h4>
              <ul className="space-y-1">
                {riskAssessment.recommendations.map((rec: string, index: number) => (
                  <li key={index} className={`text-sm flex items-start space-x-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top Recommendations */}
      <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Principais Recomendações
          </h3>
          <span className={`text-sm px-3 py-1 rounded-full ${
            isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            IA Personalizada
          </span>
        </div>

        <div className="space-y-3">
          {recommendations.slice(0, 3).map((rec) => (
            <div key={rec.id} className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {rec.title}
                  </h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {rec.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(rec.confidence)}`}>
                      {Math.round(rec.confidence * 100)}% confiança
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {rec.timeToImplement}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {rec.impact === 'high' && <Zap className="h-4 w-4 text-yellow-500" />}
                  {rec.urgency === 'high' && <Clock className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPredictionsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {predictions.map((prediction) => (
          <div key={prediction.id} className={`p-6 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Previsão de {prediction.type === 'income' ? 'Receitas' : 'Despesas'}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(prediction.confidence)}`}>
                {Math.round(prediction.confidence * 100)}% confiança
              </span>
            </div>

            <div className="mb-4">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(prediction.value)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Próximo mês
              </p>
            </div>

            {/* Scenarios */}
            <div className="space-y-2 mb-4">
              <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Cenários:
              </h4>
              {prediction.scenarios.map((scenario) => (
                <div key={scenario.name} className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {scenario.name === 'optimistic' ? 'Otimista' : 
                     scenario.name === 'realistic' ? 'Realista' : 'Pessimista'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatCurrency(scenario.value)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {Math.round(scenario.probability * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Factors */}
            <div>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Principais Fatores:
              </h4>
              <div className="space-y-1">
                {prediction.factors.slice(0, 3).map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {factor.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-16 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${factor.impact * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {Math.round(factor.impact * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations based on predictions */}
      {predictions.length > 0 && (
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recomendações Baseadas nas Previsões
          </h3>
          <div className="space-y-2">
            {predictions.flatMap(p => p.recommendations).map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderMarketTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketTrends.map((trend) => (
          <div key={trend.id} className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {trend.indicator.toUpperCase()}
              </h3>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getTrendColor(trend.trend)}`}>
                {getTrendIcon(trend.trend)}
                <span className="ml-1">{trend.trend === 'up' ? 'Alta' : trend.trend === 'down' ? 'Baixa' : 'Estável'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Atual:
                </span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {trend.indicator === 'selic' || trend.indicator === 'inflation' 
                    ? `${trend.currentValue}%` 
                    : trend.currentValue.toLocaleString('pt-BR')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Previsto:
                </span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {trend.indicator === 'selic' || trend.indicator === 'inflation' 
                    ? `${trend.predictedValue}%` 
                    : trend.predictedValue.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Confiança:
                </span>
                <span className={`text-sm px-2 py-1 rounded-full ${getConfidenceColor(trend.confidence)}`}>
                  {Math.round(trend.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {trend.description}
              </p>
              {trend.personalRelevance && (
                <p className={`text-xs mt-1 font-medium ${
                  trend.impact === 'positive' ? 'text-green-600' : 
                  trend.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.personalRelevance}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderInvestmentsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {investmentRecs.map((rec) => (
          <div key={rec.id} className={`p-6 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {rec.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rec.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  rec.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {rec.riskLevel === 'low' ? 'Baixo Risco' : 
                   rec.riskLevel === 'medium' ? 'Médio Risco' : 'Alto Risco'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(rec.confidence)}`}>
                  {Math.round(rec.confidence * 100)}%
                </span>
              </div>
            </div>

            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {rec.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Retorno Esperado
                </span>
                <p className={`text-lg font-semibold text-green-600`}>
                  {rec.expectedReturn}% a.a.
                </p>
              </div>
              <div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Investimento Mínimo
                </span>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(rec.minimumInvestment)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Vantagens:
                </h4>
                <ul className="space-y-1">
                  {rec.pros.slice(0, 3).map((pro, index) => (
                    <li key={index} className={`text-xs flex items-start space-x-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Desvantagens:
                </h4>
                <ul className="space-y-1">
                  {rec.cons.slice(0, 2).map((con, index) => (
                    <li key={index} className={`text-xs flex items-start space-x-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong>Justificativa:</strong> {rec.reasoning}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={`rounded-lg border p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <Brain className={`h-12 w-12 mx-auto mb-4 animate-pulse ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Analisando seus dados financeiros com IA...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🧠 Inteligência Artificial Financeira
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Análises preditivas e recomendações personalizadas
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAssistant(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Assistente IA</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { key: 'predictions', label: 'Previsões', icon: LineChart },
            { key: 'market', label: 'Mercado', icon: TrendingUp },
            { key: 'investments', label: 'Investimentos', icon: DollarSign }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? isDark
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/10'
                    : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'predictions' && renderPredictionsTab()}
          {activeTab === 'market' && renderMarketTab()}
          {activeTab === 'investments' && renderInvestmentsTab()}
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        isOpen={showAssistant}
        onToggle={() => setShowAssistant(!showAssistant)}
        userProfile={userProfile}
      />
    </>
  )
}
