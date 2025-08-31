import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
vi.mock('@/lib/api', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
  apiClient: {
    getAccounts: vi.fn(() => Promise.resolve([])),
    getTransactions: vi.fn(() => Promise.resolve([])),
    getBudgets: vi.fn(() => Promise.resolve([])),
    getFinancialSummary: vi.fn(() => Promise.resolve({
      total_income: 0,
      total_expense: 0,
      net_balance: 0,
      accounts: [],
      recent_transactions: []
    })),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}))

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(() => ({
    data: undefined,
    error: undefined,
    mutate: vi.fn(),
  })),
}))

// Mock Recharts
vi.mock('recharts', () => ({
  PieChart: vi.fn(({ children }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children)),
  Pie: vi.fn(() => React.createElement('div', { 'data-testid': 'pie' })),
  Cell: vi.fn(() => React.createElement('div', { 'data-testid': 'cell' })),
  ResponsiveContainer: vi.fn(({ children }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children)),
  BarChart: vi.fn(({ children }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children)),
  Bar: vi.fn(() => React.createElement('div', { 'data-testid': 'bar' })),
  XAxis: vi.fn(() => React.createElement('div', { 'data-testid': 'x-axis' })),
  YAxis: vi.fn(() => React.createElement('div', { 'data-testid': 'y-axis' })),
  CartesianGrid: vi.fn(() => React.createElement('div', { 'data-testid': 'cartesian-grid' })),
  Tooltip: vi.fn(() => React.createElement('div', { 'data-testid': 'tooltip' })),
  Legend: vi.fn(() => React.createElement('div', { 'data-testid': 'legend' })),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
