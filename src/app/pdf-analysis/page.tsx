"use client"

import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useCrewAI } from '@/hooks/useFinancialData'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PieChart,
  Lightbulb,
  Loader2
} from 'lucide-react'

export default function PDFAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<{
    structured_analysis?: {
      summary?: string
      total_income?: number
      total_expenses?: number
      total_transactions?: number
      categories?: Array<{
        name: string
        amount: number
        percentage: number
        transactions: number
      }>
      alerts?: string[]
    }
    insights?: string[]
    recommendations?: string[]
    crewai_analysis_result?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { analyzePDF } = useCrewAI()
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        setAnalysis(null)
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive"
        })
      }
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um PDF primeiro.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const result = await analyzePDF(selectedFile)
      setAnalysis(result)

      toast({
        title: "Análise concluída!",
        description: "Seu documento foi analisado com IA. Confira os insights abaixo.",
        variant: "success"
      })

    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o PDF. Verifique se o arquivo não está corrompido.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Análise de PDF com IA">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload de Documento Financeiro
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um PDF
                </h3>
                <p className="text-gray-600 mb-4">
                  Extratos bancários, faturas de cartão, relatórios financeiros
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher PDF
                </label>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <PieChart className="h-4 w-4 mr-2" />
                      Analisar com IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Resumo da Análise
                </h2>
              </div>
              
              {analysis.structured_analysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Receitas</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {analysis.structured_analysis.total_income?.toFixed(2) || '0,00'}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Despesas</p>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {analysis.structured_analysis.total_expenses?.toFixed(2) || '0,00'}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Transações</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysis.structured_analysis.total_transactions || 0}
                    </p>
                  </div>
                </div>
              )}

              <div className="prose max-w-none">
                <p className="text-gray-700">
                  {analysis.structured_analysis?.summary || 
                   "Documento analisado com sucesso. Confira os insights e recomendações abaixo."}
                </p>
              </div>
            </div>

            {/* Categories */}
            {analysis.structured_analysis?.categories && analysis.structured_analysis.categories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Gastos por Categoria
                </h3>
                <div className="space-y-3">
                  {analysis.structured_analysis.categories.map((category, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className="text-sm text-gray-500">
                          {category.transactions} transações
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          R$ {category.amount?.toFixed(2) || '0,00'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {category.percentage?.toFixed(1) || '0'}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Lightbulb className="h-6 w-6 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Insights Inteligentes
                  </h3>
                </div>
                <div className="space-y-3">
                  {analysis.insights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recomendações Personalizadas
                  </h3>
                </div>
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {analysis.structured_analysis?.alerts && analysis.structured_analysis.alerts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Alertas Importantes
                  </h3>
                </div>
                <div className="space-y-3">
                  {analysis.structured_analysis.alerts.map((alert: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Análise Completa da IA
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {analysis.crewai_analysis_result}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-medium text-blue-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Dicas para melhor análise
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Use PDFs com texto selecionável (não imagens escaneadas)</li>
            <li>• Extratos bancários e faturas de cartão funcionam melhor</li>
            <li>• Documentos em português têm melhor precisão</li>
            <li>• Arquivos até 10MB são suportados</li>
          </ul>
        </div>
      </div>
    </AuthLayout>
  )
}
