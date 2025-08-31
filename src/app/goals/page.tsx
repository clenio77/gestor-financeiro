'use client'

import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useFinancialGoals, useGoalAnalytics } from '@/hooks/useFinancialData'
import { FinancialGoal, GoalFormData } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PlusCircle, Target, TrendingUp, Calendar, AlertTriangle, CheckCircle2, Clock, DollarSign } from 'lucide-react'

export default function GoalsPage() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, addContribution } = useFinancialGoals()
  const { analytics } = useGoalAnalytics()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)
  const [showContributionForm, setShowContributionForm] = useState<number | null>(null)

  const handleCreateGoal = async (formData: GoalFormData) => {
    try {
      await createGoal(formData)
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const handleAddContribution = async (goalId: number, amount: number, description?: string) => {
    try {
      await addContribution(goalId, amount, description)
      setShowContributionForm(null)
    } catch (error) {
      console.error('Error adding contribution:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'active': return 'text-blue-600 bg-blue-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <AuthLayout title="Metas Financeiras">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Metas Financeiras">
      <div className="space-y-6">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Metas</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_goals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Progresso Geral</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overall_progress.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Metas Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completed_goals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.total_target_amount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suas Metas Financeiras</h1>
            <p className="text-gray-600">Defina e acompanhe seus objetivos financeiros</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Nova Meta
          </button>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta criada</h3>
            <p className="text-gray-600 mb-4">Comece definindo seus objetivos financeiros</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar Primeira Meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>{goal.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Atual:</span>
                    <span className="font-medium">{formatCurrency(goal.current_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Meta:</span>
                    <span className="font-medium">{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Restante:</span>
                    <span className="font-medium">{formatCurrency(goal.target_amount - goal.current_amount)}</span>
                  </div>
                </div>

                {/* Date Info */}
                {goal.target_date && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Meta: {formatDate(goal.target_date)}</span>
                    {goal.days_remaining && (
                      <span className={`ml-2 ${goal.days_remaining < 30 ? 'text-red-600' : 'text-gray-600'}`}>
                        ({goal.days_remaining} dias)
                      </span>
                    )}
                  </div>
                )}

                {/* Status Indicator */}
                <div className="mb-4 flex items-center gap-2 text-sm">
                  {goal.is_on_track ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">No prazo</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600">Atenção necessária</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowContributionForm(goal.id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Contribuir
                  </button>
                  <button
                    onClick={() => setSelectedGoal(goal)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Goal Form Modal */}
        {showCreateForm && (
          <CreateGoalModal
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateGoal}
          />
        )}

        {/* Contribution Form Modal */}
        {showContributionForm && (
          <ContributionModal
            goalId={showContributionForm}
            onClose={() => setShowContributionForm(null)}
            onSubmit={handleAddContribution}
          />
        )}

        {/* Goal Details Modal */}
        {selectedGoal && (
          <GoalDetailsModal
            goal={selectedGoal}
            onClose={() => setSelectedGoal(null)}
            onUpdate={updateGoal}
            onDelete={deleteGoal}
          />
        )}
      </div>
    </AuthLayout>
  )
}

// Placeholder components - will be implemented next
function CreateGoalModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: GoalFormData) => void }) {
  return <div>Create Goal Modal - TODO</div>
}

function ContributionModal({ goalId, onClose, onSubmit }: { goalId: number; onClose: () => void; onSubmit: (goalId: number, amount: number, description?: string) => void }) {
  return <div>Contribution Modal - TODO</div>
}

function GoalDetailsModal({ goal, onClose, onUpdate, onDelete }: { goal: FinancialGoal; onClose: () => void; onUpdate: (id: number, data: Partial<GoalFormData>) => void; onDelete: (id: number) => void }) {
  return <div>Goal Details Modal - TODO</div>
}
