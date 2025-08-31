export interface User {
  id: number
  email: string
  created_at: string
  subscription_type: 'free' | 'premium'
  subscription_expires_at?: string
}

export interface Account {
  id: number
  name: string
  balance: number
  user_id: number
  created_at: string
}

export interface Transaction {
  id: number
  description: string
  amount: number
  type: 'income' | 'expense'
  account_id: number
  user_id: number
  created_at: string
  category?: string
}

export interface Budget {
  id: number
  category: string
  amount: number
  user_id: number
  created_at: string
  spent?: number
}

export interface FinancialSummary {
  total_income: number
  total_expense: number
  net_balance: number
  accounts: Account[]
  recent_transactions: Transaction[]
}

// Financial Goals Types
export interface FinancialGoal {
  id: number
  user_id: string
  title: string
  description?: string
  target_amount: number
  current_amount: number
  target_date?: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  goal_type: 'savings' | 'debt_payment' | 'investment' | 'expense_reduction' | 'income_increase'
  auto_contribute: boolean
  auto_contribute_amount?: number
  auto_contribute_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  created_at: string
  updated_at: string
  completed_at?: string
  progress_percentage: number
  days_remaining?: number
  estimated_completion_date?: string
  is_on_track: boolean
}

export interface GoalContribution {
  id: number
  goal_id: number
  user_id: string
  amount: number
  contribution_date: string
  description?: string
  transaction_id?: number
  is_automatic: boolean
  created_at: string
}

export interface GoalAlert {
  id: number
  goal_id: number
  user_id: string
  alert_type: 'milestone' | 'deadline_warning' | 'off_track' | 'completed' | 'overdue'
  title: string
  message: string
  is_read: boolean
  severity: 'info' | 'warning' | 'error' | 'success'
  created_at: string
  read_at?: string
}

export interface GoalMilestone {
  id: number
  goal_id: number
  percentage: number
  amount: number
  title?: string
  description?: string
  achieved_at?: string
  created_at: string
}

export interface GoalFormData {
  title: string
  description?: string
  target_amount: number
  target_date?: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  goal_type: 'savings' | 'debt_payment' | 'investment' | 'expense_reduction' | 'income_increase'
  auto_contribute: boolean
  auto_contribute_amount?: number
  auto_contribute_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export interface GoalAnalytics {
  total_goals: number
  active_goals: number
  completed_goals: number
  total_target_amount: number
  total_current_amount: number
  overall_progress: number
  goals_on_track: number
  goals_behind_schedule: number
  average_completion_time: number
  most_successful_category: string
  upcoming_deadlines: FinancialGoal[]
  recent_achievements: GoalMilestone[]
}

export interface OCRResult {
  extracted_text: string
  confidence?: number
}

export interface CrewAIAnalysis {
  extracted_pdf_text: string
  crewai_analysis_result: string
  insights?: string[]
  recommendations?: string[]
}

export interface AuthTokens {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword?: string
}

export interface TransactionFormData {
  description: string
  amount: number
  type: 'income' | 'expense'
  account_id: number
  category?: string
}

export interface AccountFormData {
  name: string
  balance: number
}

export interface BudgetFormData {
  category: string
  amount: number
}

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

export interface CategoryData {
  category: string
  amount: number
  percentage: number
  transactions: number
}

export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: Date
  read: boolean
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface OfflineData {
  transactions: Transaction[]
  accounts: Account[]
  lastSync: Date
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type Theme = 'light' | 'dark' | 'system'

export type Language = 'pt-BR' | 'en-US' | 'es-ES'
