"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { useTransactions, useAccounts } from '@/hooks/useFinancialData'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, DollarSign, FileText, CreditCard, Tag } from 'lucide-react'
import Link from 'next/link'

export default function NewTransactionPage() {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [accountId, setAccountId] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const { createTransaction } = useTransactions()
  const { accounts, loading: accountsLoading } = useAccounts()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (accounts && accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id.toString())
    }
  }, [accounts, accountId])

  const handleSubmit = async (e: React.FormEvent) => {
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
        title: "Transação criada!",
        description: "A transação foi registrada com sucesso.",
        variant: "success"
      })

      router.push('/transactions')
    } catch (error) {
      toast({
        title: "Erro ao criar transação",
        description: "Não foi possível registrar a transação. Tente novamente.",
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
    <AuthLayout title="Nova Transação">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link
            href="/transactions"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nova Transação</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Transação
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    type === 'expense'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-red-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">Despesa</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    type === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Receita</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Almoço no restaurante"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
                Conta
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  disabled={accountsLoading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (Saldo: R$ {account.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria (Opcional)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Link
                href="/transactions"
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || accountsLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Transação'}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Dica</h3>
          <p className="text-sm text-blue-700">
            Você também pode usar o <Link href="/ocr" className="underline">OCR Upload</Link> para 
            extrair dados automaticamente de recibos e notas fiscais!
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
