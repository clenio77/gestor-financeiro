import { createClient } from '@supabase/supabase-js'
import {
  User,
  Account,
  Transaction,
  Budget,
  FinancialSummary,
  OCRResult,
  CrewAIAnalysis,
  AuthTokens,
  LoginCredentials,
  RegisterData,
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

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

class ApiClient {
  constructor() {
    // No need for axios configuration with Supabase
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (error) throw error

    return {
      access_token: data.session?.access_token || '',
      token_type: 'bearer'
    }
  }

  async register(data: RegisterData): Promise<User> {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password
    })

    if (error) throw error

    return {
      id: parseInt(authData.user?.id || '0'),
      email: authData.user?.email || '',
      created_at: authData.user?.created_at || '',
      subscription_type: 'free'
    }
  }

  async getCurrentUser(): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error('No user found')

    return {
      id: parseInt(user.id),
      email: user.email || '',
      created_at: user.created_at || '',
      subscription_type: 'free'
    }
  }

  // Account endpoints
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createAccount(accountData: AccountFormData): Promise<Account> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('accounts')
      .insert([{
        ...accountData,
        user_id: user.id
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAccount(id: number, accountData: Partial<AccountFormData>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update(accountData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAccount(id: number): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Transaction endpoints
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createTransaction(transactionData: TransactionFormData): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        user_id: user.id
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTransaction(id: number, transactionData: Partial<TransactionFormData>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(transactionData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTransaction(id: number): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Budget endpoints
  async getBudgets(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createBudget(budgetData: BudgetFormData): Promise<Budget> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('budgets')
      .insert([{
        ...budgetData,
        user_id: user.id
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateBudget(id: number, budgetData: Partial<BudgetFormData>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(budgetData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteBudget(id: number): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Dashboard endpoint
  async getFinancialSummary(): Promise<FinancialSummary> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)

    if (accountsError) throw accountsError

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (transactionsError) throw transactionsError

    // Calculate totals
    const allTransactions = await this.getTransactions()
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_balance: totalIncome - totalExpense,
      accounts: accounts || [],
      recent_transactions: transactions || []
    }
  }

  // OCR endpoint
  async extractTextFromImage(file: File): Promise<OCRResult & { structured_data?: any }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to extract text from image')
    }

    const data = await response.json()
    return {
      extracted_text: data.extracted_text,
      structured_data: data.structured_data,
      confidence: data.structured_data?.confidence || 0.8
    }
  }

  // AI Analysis endpoint (replaces CrewAI)
  async analyzePDF(file: File): Promise<CrewAIAnalysis & { structured_analysis?: any }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/analyze-pdf', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to analyze PDF')
    }

    const data = await response.json()
    return {
      extracted_pdf_text: data.extracted_pdf_text,
      crewai_analysis_result: data.crewai_analysis_result,
      structured_analysis: data.structured_analysis,
      insights: data.insights || [],
      recommendations: data.recommendations || []
    }
  }

  // Financial Goals endpoints
  async getFinancialGoals(): Promise<FinancialGoal[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate additional fields
    return data.map(goal => ({
      ...goal,
      progress_percentage: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
      days_remaining: goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      is_on_track: this.calculateIfGoalIsOnTrack(goal)
    }))
  }

  async createFinancialGoal(goalData: GoalFormData): Promise<FinancialGoal> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        ...goalData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateFinancialGoal(id: number, goalData: Partial<GoalFormData>): Promise<FinancialGoal> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('financial_goals')
      .update(goalData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteFinancialGoal(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async addGoalContribution(goalId: number, amount: number, description?: string): Promise<GoalContribution> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        amount,
        description
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getGoalContributions(goalId: number): Promise<GoalContribution[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', user.id)
      .order('contribution_date', { ascending: false })

    if (error) throw error
    return data
  }

  async getGoalAlerts(): Promise<GoalAlert[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('goal_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data
  }

  async markAlertAsRead(alertId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('goal_alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async getGoalMilestones(goalId: number): Promise<GoalMilestone[]> {
    const { data, error } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId)
      .order('percentage', { ascending: true })

    if (error) throw error
    return data
  }

  async getGoalAnalytics(): Promise<GoalAnalytics> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const goals = await this.getFinancialGoals()

    const analytics: GoalAnalytics = {
      total_goals: goals.length,
      active_goals: goals.filter(g => g.status === 'active').length,
      completed_goals: goals.filter(g => g.status === 'completed').length,
      total_target_amount: goals.reduce((sum, g) => sum + g.target_amount, 0),
      total_current_amount: goals.reduce((sum, g) => sum + g.current_amount, 0),
      overall_progress: 0,
      goals_on_track: goals.filter(g => g.is_on_track).length,
      goals_behind_schedule: goals.filter(g => !g.is_on_track && g.status === 'active').length,
      average_completion_time: 0,
      most_successful_category: '',
      upcoming_deadlines: goals.filter(g => g.days_remaining && g.days_remaining <= 30).slice(0, 5),
      recent_achievements: []
    }

    if (analytics.total_target_amount > 0) {
      analytics.overall_progress = (analytics.total_current_amount / analytics.total_target_amount) * 100
    }

    return analytics
  }

  private calculateIfGoalIsOnTrack(goal: any): boolean {
    if (!goal.target_date || goal.status !== 'active') return true

    const now = new Date()
    const targetDate = new Date(goal.target_date)
    const createdDate = new Date(goal.created_at)

    const totalDays = Math.ceil((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    if (totalDays <= 0) return true

    const expectedProgress = (daysPassed / totalDays) * 100
    const actualProgress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0

    return actualProgress >= expectedProgress * 0.8 // 80% tolerance
  }

  // Subscription endpoints (placeholder - implement with payment provider)
  async upgradeSubscription(plan: string): Promise<{ checkout_url: string }> {
    // TODO: Implement with Stripe or other payment provider
    // For now, return a placeholder
    return {
      checkout_url: `https://checkout.stripe.com/pay/${plan}`
    }
  }

  async cancelSubscription(): Promise<void> {
    // TODO: Implement subscription cancellation
    console.log('Subscription cancellation requested')
  }

  async getSubscriptionStatus(): Promise<{ status: string; expires_at?: string }> {
    // TODO: Get subscription status from user metadata or separate table
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    return {
      status: 'free', // Default to free plan
      expires_at: undefined
    }
  }
}

export const apiClient = new ApiClient()
export default apiClient
