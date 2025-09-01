"use client"

import AuthLayout from '@/components/AuthLayout'
import { useFinancialSummary } from '@/hooks/useFinancialData'
import { formatCurrency } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { BankingDashboard } from '@/components/BankingDashboard'

export default function DashboardPage() {
  const { summary, loading, error } = useFinancialSummary()

  if (loading) {
    return (
      <AuthLayout title="Dashboard">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (error) {
    return (
      <AuthLayout title="Dashboard">
        <div className="text-center py-12">
          <p className="text-red-600">Erro ao carregar dados do dashboard</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </AuthLayout>
    )
  }

  const netBalance = (summary?.total_income || 0) - (summary?.total_expense || 0)
  const isPositive = netBalance >= 0

  // Prepare chart data
  const pieData = [
    { name: 'Receitas', value: summary?.total_income || 0, color: '#10b981' },
    { name: 'Despesas', value: summary?.total_expense || 0, color: '#ef4444' },
  ]

  const barData = summary?.recent_transactions?.slice(0, 10).map((transaction, index) => ({
    name: transaction.description.substring(0, 15) + '...',
    value: transaction.amount,
    type: transaction.type,
  })) || []

  return (
    <AuthLayout title="Dashboard">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Income */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receitas Totais</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.total_income || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Despesas Totais</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary?.total_expense || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Net Balance */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netBalance)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isPositive ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`h-6 w-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição Financeira</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transações Recentes</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar
                    dataKey="value"
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/transactions/new"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PlusCircle className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Nova Transação</span>
            </Link>
            
            <Link
              href="/accounts/new"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Nova Conta</span>
            </Link>
            
            <Link
              href="/ocr"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowUpRight className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">OCR Upload</span>
            </Link>
            
            <Link
              href="/pdf-analysis"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownRight className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Análise PDF</span>
            </Link>
          </div>
        </div>

        {/* Recent Transactions List */}
        {summary?.recent_transactions && summary.recent_transactions.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
              <Link href="/transactions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas
              </Link>
            </div>
            <div className="space-y-3">
              {summary.recent_transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banking Integration */}
        <div className="mt-8">
          <BankingDashboard />
        </div>
      </div>
    </AuthLayout>
  )
}
