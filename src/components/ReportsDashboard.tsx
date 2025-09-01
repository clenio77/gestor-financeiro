'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'
import { reportGenerator, ReportConfig, GeneratedReport } from '@/lib/report-generator'
import { AdvancedCharts, ChartConfig, ChartData } from './AdvancedCharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReportsDashboardProps {
  transactions?: any[]
  accounts?: any[]
  budgets?: any[]
  goals?: any[]
}

export function ReportsDashboard({ 
  transactions = [], 
  accounts = [], 
  budgets = [], 
  goals = [] 
}: ReportsDashboardProps) {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [configs, setConfigs] = useState<ReportConfig[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'reports' | 'charts' | 'export'>('reports')
  const [selectedConfig, setSelectedConfig] = useState<ReportConfig | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadReportConfigs()
  }, [])

  const loadReportConfigs = () => {
    const reportConfigs = reportGenerator.getConfigs()
    setConfigs(reportConfigs)
  }

  const generateSampleData = () => {
    // Generate sample data for demonstration
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    // Sample transactions if none provided
    const sampleTransactions = transactions.length > 0 ? transactions : [
      { id: '1', date: lastMonth, description: 'Supermercado Extra', category: 'Alimentação', amount: -250.50, type: 'expense' },
      { id: '2', date: lastMonth, description: 'Salário', category: 'Renda', amount: 5000.00, type: 'income' },
      { id: '3', date: lastMonth, description: 'Posto Shell', category: 'Transporte', amount: -120.00, type: 'expense' },
      { id: '4', date: lastMonth, description: 'Netflix', category: 'Entretenimento', amount: -29.90, type: 'expense' },
      { id: '5', date: lastMonth, description: 'Farmácia', category: 'Saúde', amount: -85.30, type: 'expense' }
    ]

    // Calculate summary
    const totalIncome = sampleTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = Math.abs(sampleTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0))
    
    const balance = totalIncome - totalExpenses

    // Group expenses by category
    const expensesByCategory = sampleTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category
        if (!acc[category]) {
          acc[category] = { name: category, value: 0 }
        }
        acc[category].value += Math.abs(t.amount)
        return acc
      }, {} as any)

    return {
      summary: {
        totalIncome,
        totalExpenses,
        balance
      },
      transactions: sampleTransactions,
      expenses_by_category: Object.values(expensesByCategory),
      income_trend: [
        { month: 'Jan', amount: 4800 },
        { month: 'Fev', amount: 5000 },
        { month: 'Mar', amount: 5200 },
        { month: 'Abr', amount: 5000 },
        { month: 'Mai', amount: 5100 }
      ],
      recent_transactions: sampleTransactions.slice(0, 10)
    }
  }

  const handleGenerateReport = async (configId: string) => {
    setLoading(true)
    try {
      const data = generateSampleData()
      const report = await reportGenerator.generateReport(configId, data)
      
      // Download the report
      downloadReport(report)
      
      setGeneratedReports(prev => [report, ...prev])
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (report: GeneratedReport) => {
    const blob = new Blob([report.data as BlobPart], {
      type: getContentType(report.format)
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.name}.${report.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getContentType = (format: string): string => {
    switch (format) {
      case 'pdf': return 'application/pdf'
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case 'csv': return 'text/csv'
      case 'json': return 'application/json'
      default: return 'application/octet-stream'
    }
  }

  const handleCreateReport = () => {
    const newConfig: Omit<ReportConfig, 'id' | 'createdAt'> = {
      name: 'Relatório Personalizado',
      description: 'Relatório financeiro personalizado',
      type: 'financial_summary',
      format: 'pdf',
      template: reportGenerator.getTemplates()[0],
      filters: {
        dateRange: {
          start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          end: new Date()
        }
      },
      isActive: true
    }

    const config = reportGenerator.createConfig(newConfig)
    setConfigs(prev => [config, ...prev])
    setShowCreateModal(false)
  }

  const chartConfigs: ChartConfig[] = [
    {
      type: 'pie',
      data: generateSampleData().expenses_by_category as ChartData[],
      title: 'Gastos por Categoria',
      subtitle: 'Distribuição dos gastos do último mês',
      yAxisKey: 'value',
      colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      showLegend: true,
      showTooltip: true,
      height: 300,
      responsive: true,
      drillDown: true
    },
    {
      type: 'line',
      data: generateSampleData().income_trend as ChartData[],
      title: 'Tendência de Receitas',
      subtitle: 'Evolução das receitas nos últimos meses',
      xAxisKey: 'month',
      yAxisKey: 'amount',
      colors: ['#10B981'],
      showLegend: false,
      showTooltip: true,
      showGrid: true,
      height: 300,
      responsive: true
    },
    {
      type: 'bar',
      data: [
        { name: 'Jan', receitas: 5000, despesas: 3500 },
        { name: 'Fev', receitas: 5200, despesas: 3800 },
        { name: 'Mar', receitas: 4800, despesas: 3200 },
        { name: 'Abr', receitas: 5100, despesas: 3600 },
        { name: 'Mai', receitas: 5000, despesas: 3400 }
      ],
      title: 'Receitas vs Despesas',
      subtitle: 'Comparação mensal',
      xAxisKey: 'name',
      dataKeys: ['receitas', 'despesas'],
      colors: ['#10B981', '#EF4444'],
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      height: 300,
      responsive: true
    }
  ]

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              📊 Relatórios e Análises
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Gere relatórios personalizados e visualize dados avançados
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Novo Relatório
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'reports', label: 'Relatórios', count: configs.length },
          { key: 'charts', label: 'Gráficos', count: chartConfigs.length },
          { key: 'export', label: 'Exportações', count: generatedReports.length }
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
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {configs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📄</div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nenhum relatório configurado. Crie seu primeiro relatório personalizado.
                </p>
              </div>
            ) : (
              configs.map(config => (
                <div
                  key={config.id}
                  className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {config.name}
                      </h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {config.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Formato: {config.format.toUpperCase()}
                        </span>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Tipo: {config.type}
                        </span>
                        {config.lastGenerated && (
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Último: {format(config.lastGenerated, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerateReport(config.id)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                          : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
                      }`}
                    >
                      {loading ? 'Gerando...' : 'Gerar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            {chartConfigs.map((chartConfig, index) => (
              <AdvancedCharts
                key={index}
                config={chartConfig}
                onDrillDown={(data) => console.log('Drill down:', data)}
                onFilterChange={(filters) => console.log('Filters changed:', filters)}
              />
            ))}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            {generatedReports.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📤</div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nenhum relatório gerado ainda. Gere um relatório para vê-lo aqui.
                </p>
              </div>
            ) : (
              generatedReports.map(report => (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {report.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Formato: {report.format.toUpperCase()}
                        </span>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Tamanho: {formatFileSize(report.size)}
                        </span>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Gerado: {format(report.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {report.metadata.totalRecords} registros
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadReport(report)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 p-6 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Criar Novo Relatório
            </h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Um relatório padrão será criado com as configurações básicas. Você poderá personalizá-lo depois.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateReport}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Criar Relatório
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
