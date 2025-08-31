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
