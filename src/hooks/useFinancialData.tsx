"use client"

import useSWR from 'swr'
import { apiClient } from '@/lib/api'
import {
  Account,
  Transaction,
  Budget,
  FinancialSummary,
  TransactionFormData,
  AccountFormData,
  BudgetFormData,
  FinancialGoal,
  GoalContribution,
  GoalAlert,
  GoalMilestone,
  GoalFormData,
  GoalAnalytics
} from '@/types'

// SWR fetcher functions
const accountsFetcher = () => apiClient.getAccounts()
const transactionsFetcher = () => apiClient.getTransactions()
const budgetsFetcher = () => apiClient.getBudgets()
const summaryFetcher = () => apiClient.getFinancialSummary()
const goalsFetcher = () => apiClient.getFinancialGoals()
const goalAlertsFetcher = () => apiClient.getGoalAlerts()
const goalAnalyticsFetcher = () => apiClient.getGoalAnalytics()

export function useAccounts() {
  const { data, error, mutate } = useSWR<Account[]>('/accounts', accountsFetcher)

  const createAccount = async (accountData: AccountFormData) => {
    const newAccount = await apiClient.createAccount(accountData)
    mutate([...(data || []), newAccount], false)
    return newAccount
  }

  const updateAccount = async (id: number, accountData: Partial<AccountFormData>) => {
    const updatedAccount = await apiClient.updateAccount(id, accountData)
    mutate(
      data?.map(account => account.id === id ? updatedAccount : account),
      false
    )
    return updatedAccount
  }

  const deleteAccount = async (id: number) => {
    await apiClient.deleteAccount(id)
    mutate(data?.filter(account => account.id !== id), false)
  }

  return {
    accounts: data,
    loading: !error && !data,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    mutate,
  }
}

export function useTransactions() {
  const { data, error, mutate } = useSWR<Transaction[]>('/transactions', transactionsFetcher)

  const createTransaction = async (transactionData: TransactionFormData) => {
    const newTransaction = await apiClient.createTransaction(transactionData)
    mutate([newTransaction, ...(data || [])], false)
    return newTransaction
  }

  const updateTransaction = async (id: number, transactionData: Partial<TransactionFormData>) => {
    const updatedTransaction = await apiClient.updateTransaction(id, transactionData)
    mutate(
      data?.map(transaction => transaction.id === id ? updatedTransaction : transaction),
      false
    )
    return updatedTransaction
  }

  const deleteTransaction = async (id: number) => {
    await apiClient.deleteTransaction(id)
    mutate(data?.filter(transaction => transaction.id !== id), false)
  }

  return {
    transactions: data,
    loading: !error && !data,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    mutate,
  }
}

export function useBudgets() {
  const { data, error, mutate } = useSWR<Budget[]>('/budgets', budgetsFetcher)

  const createBudget = async (budgetData: BudgetFormData) => {
    const newBudget = await apiClient.createBudget(budgetData)
    mutate([...(data || []), newBudget], false)
    return newBudget
  }

  const updateBudget = async (id: number, budgetData: Partial<BudgetFormData>) => {
    const updatedBudget = await apiClient.updateBudget(id, budgetData)
    mutate(
      data?.map(budget => budget.id === id ? updatedBudget : budget),
      false
    )
    return updatedBudget
  }

  const deleteBudget = async (id: number) => {
    await apiClient.deleteBudget(id)
    mutate(data?.filter(budget => budget.id !== id), false)
  }

  return {
    budgets: data,
    loading: !error && !data,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    mutate,
  }
}

export function useFinancialSummary() {
  const { data, error, mutate } = useSWR<FinancialSummary>('/dashboard/summary', summaryFetcher)

  return {
    summary: data,
    loading: !error && !data,
    error,
    mutate,
  }
}

// Financial Goals Hooks
export function useFinancialGoals() {
  const { data, error, mutate } = useSWR<FinancialGoal[]>('/financial-goals', goalsFetcher)

  const createGoal = async (goalData: GoalFormData) => {
    const newGoal = await apiClient.createFinancialGoal(goalData)
    mutate()
    return newGoal
  }

  const updateGoal = async (id: number, goalData: Partial<GoalFormData>) => {
    const updatedGoal = await apiClient.updateFinancialGoal(id, goalData)
    mutate()
    return updatedGoal
  }

  const deleteGoal = async (id: number) => {
    await apiClient.deleteFinancialGoal(id)
    mutate()
  }

  const addContribution = async (goalId: number, amount: number, description?: string) => {
    const contribution = await apiClient.addGoalContribution(goalId, amount, description)
    mutate() // Refresh goals to update current_amount
    return contribution
  }

  return {
    goals: data || [],
    loading: !error && !data,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    refresh: mutate
  }
}

export function useGoalContributions(goalId: number) {
  const { data, error, mutate } = useSWR<GoalContribution[]>(
    goalId ? `/goal-contributions/${goalId}` : null,
    () => apiClient.getGoalContributions(goalId)
  )

  return {
    contributions: data || [],
    loading: !error && !data,
    error,
    refresh: mutate
  }
}

export function useGoalAlerts() {
  const { data, error, mutate } = useSWR<GoalAlert[]>('/goal-alerts', goalAlertsFetcher)

  const markAsRead = async (alertId: number) => {
    await apiClient.markAlertAsRead(alertId)
    mutate()
  }

  const unreadCount = data ? data.filter(alert => !alert.is_read).length : 0

  return {
    alerts: data || [],
    unreadCount,
    loading: !error && !data,
    error,
    markAsRead,
    refresh: mutate
  }
}

export function useGoalMilestones(goalId: number) {
  const { data, error, mutate } = useSWR<GoalMilestone[]>(
    goalId ? `/goal-milestones/${goalId}` : null,
    () => apiClient.getGoalMilestones(goalId)
  )

  return {
    milestones: data || [],
    loading: !error && !data,
    error,
    refresh: mutate
  }
}

export function useGoalAnalytics() {
  const { data, error, mutate } = useSWR<GoalAnalytics>('/goal-analytics', goalAnalyticsFetcher)

  return {
    analytics: data,
    loading: !error && !data,
    error,
    refresh: mutate
  }
}

export function useOCR() {
  const extractText = async (file: File) => {
    return await apiClient.extractTextFromImage(file)
  }

  return {
    extractText,
  }
}

export function useCrewAI() {
  const analyzePDF = async (file: File) => {
    return await apiClient.analyzePDF(file)
  }

  return {
    analyzePDF,
  }
}

export function useSubscription() {
  const upgradeSubscription = async (plan: string) => {
    return await apiClient.upgradeSubscription(plan)
  }

  const cancelSubscription = async () => {
    return await apiClient.cancelSubscription()
  }

  const getSubscriptionStatus = async () => {
    return await apiClient.getSubscriptionStatus()
  }

  return {
    upgradeSubscription,
    cancelSubscription,
    getSubscriptionStatus,
  }
}
