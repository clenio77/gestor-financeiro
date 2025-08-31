"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { useOCR, useTransactions, useAccounts } from '@/hooks/useFinancialData'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  Camera, 
  FileImage, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'

export default function OCRPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  
  // Form data for transaction
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [accountId, setAccountId] = useState('')
  const [category, setCategory] = useState('')

  const { extractText } = useOCR()
  const { createTransaction } = useTransactions()
  const { accounts, loading: accountsLoading } = useAccounts()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (accounts && accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id.toString())
    }
  }, [accounts, accountId])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file)
        setExtractedText('')
        setReviewing(false)
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive"
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione uma imagem primeiro.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const result = await extractText(selectedFile)
      const text = result.extracted_text
      setExtractedText(text)

      // Use structured data from AI if available
      if (result.structured_data) {
        const structured = result.structured_data
        setDescription(structured.description || 'Transação via OCR')
        setAmount(structured.amount?.toString() || '')
        setCategory(structured.category || '')

        // Auto-detect transaction type based on context
        if (structured.description?.toLowerCase().includes('salário') ||
            structured.description?.toLowerCase().includes('receita') ||
            structured.category?.toLowerCase().includes('receita')) {
          setType('income')
        }
      } else {
        // Fallback to simple parsing
        const lines = text.split('\n')
        let parsedAmount = ''
        let parsedDescription = ''

        // Attempt to find an amount (simple regex for numbers with optional decimal)
        const amountMatch = text.match(/\d+[.,]?\d*/g)
        if (amountMatch) {
          // Get the largest number as it's likely the total
          const amounts = amountMatch.map(a => parseFloat(a.replace(',', '.')))
          parsedAmount = Math.max(...amounts).toString()
        }

        // Use the first non-empty line as description, or a generic one
        parsedDescription = lines.find(line => line.trim() !== '') || 'Transação via OCR'

        setDescription(parsedDescription)
        setAmount(parsedAmount)
      }

      setReviewing(true)

      toast({
        title: "Dados extraídos com IA!",
        description: `Confiança: ${Math.round((result.structured_data?.confidence || 0.8) * 100)}%. Revise os dados antes de confirmar.`,
        variant: "success"
      })

    } catch (error) {
      toast({
        title: "Erro na extração",
        description: "Não foi possível extrair o texto da imagem. Verifique se a imagem está clara.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountId) {
      toast({
        title: "Erro de validação",
        description: "Selecione uma conta.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      await createTransaction({
        description,
        amount: parseFloat(amount),
        type,
        account_id: parseInt(accountId),
        category: category || undefined
      })

      toast({
        title: "Transação criada via OCR!",
        description: "A transação foi registrada com sucesso.",
        variant: "success"
      })

      router.push('/transactions')
    } catch (error) {
      toast({
        title: "Erro ao criar transação",
        description: "Não foi possível registrar a transação.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Entretenimento',
    'Compras',
    'Serviços',
    'Investimentos',
    'Outros'
  ]

  return (
    <AuthLayout title="OCR Upload">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload de Imagem
              </h2>
              
              {!reviewing && (
                <>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Selecione uma imagem
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Faça upload de recibos, notas fiscais ou comprovantes
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-flex items-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Escolher Arquivo
                        </label>
                      </div>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileImage className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleUpload}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Extraindo...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              Extrair Texto
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Extracted Text Preview */}
              {extractedText && !reviewing && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Texto Extraído
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {extractedText}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Dicas para melhor resultado
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• Use imagens com boa iluminação</li>
                <li>• Certifique-se de que o texto está legível</li>
                <li>• Evite imagens borradas ou com sombras</li>
                <li>• Formatos suportados: JPG, PNG, WEBP</li>
              </ul>
            </div>
          </div>

          {/* Review Section */}
          <div className="space-y-6">
            {reviewing && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Revisar Transação
                  </h2>
                </div>

                <form onSubmit={handleConfirm} className="space-y-4">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`p-3 border rounded-lg text-sm ${
                          type === 'expense'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        Despesa
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`p-3 border rounded-lg text-sm ${
                          type === 'income'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        Receita
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Account */}
                  <div>
                    <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
                      Conta
                    </label>
                    <select
                      id="account"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      required
                      disabled={accountsLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Selecione uma conta</option>
                      {accounts?.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} (R$ {account.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setReviewing(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Confirmar
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Raw Text */}
                {extractedText && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Texto Original Extraído
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {extractedText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
