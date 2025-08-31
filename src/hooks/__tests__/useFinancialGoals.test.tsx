import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFinancialGoals, useGoalAnalytics } from '../useFinancialData'
import { apiClient } from '@/lib/api'

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    getFinancialGoals: vi.fn(),
    createFinancialGoal: vi.fn(),
    updateFinancialGoal: vi.fn(),
    deleteFinancialGoal: vi.fn(),
    addGoalContribution: vi.fn(),
    getGoalAnalytics: vi.fn(),
  }
}))

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn((key, fetcher) => {
    if (key === '/financial-goals') {
      return {
        data: mockGoals,
        error: null,
        mutate: vi.fn(),
      }
    }
    if (key === '/goal-analytics') {
      return {
        data: mockAnalytics,
        error: null,
        mutate: vi.fn(),
      }
    }
    return {
      data: undefined,
      error: null,
      mutate: vi.fn(),
    }
  }),
}))

const mockGoals = [
  {
    id: 1,
    user_id: 'user-1',
    title: 'Reserva de Emergência',
    description: 'Guardar 6 meses de gastos',
    target_amount: 30000,
    current_amount: 15000,
    target_date: '2024-12-31',
    category: 'Emergência',
    priority: 'high',
    status: 'active',
    goal_type: 'savings',
    auto_contribute: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    progress_percentage: 50,
    days_remaining: 180,
    is_on_track: true,
  },
  {
    id: 2,
    user_id: 'user-1',
    title: 'Viagem Europa',
    description: 'Economizar para viagem dos sonhos',
    target_amount: 15000,
    current_amount: 5000,
    target_date: '2024-07-01',
    category: 'Lazer',
    priority: 'medium',
    status: 'active',
    goal_type: 'savings',
    auto_contribute: true,
    auto_contribute_amount: 500,
    auto_contribute_frequency: 'monthly',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    progress_percentage: 33.33,
    days_remaining: 90,
    is_on_track: false,
  }
]

const mockAnalytics = {
  total_goals: 2,
  active_goals: 2,
  completed_goals: 0,
  total_target_amount: 45000,
  total_current_amount: 20000,
  overall_progress: 44.44,
  goals_on_track: 1,
  goals_behind_schedule: 1,
  average_completion_time: 0,
  most_successful_category: 'Emergência',
  upcoming_deadlines: [],
  recent_achievements: []
}

describe('useFinancialGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return goals data', () => {
    const { result } = renderHook(() => useFinancialGoals())

    expect(result.current.goals).toEqual(mockGoals)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should create a new goal', async () => {
    const mockNewGoal = {
      id: 3,
      title: 'Nova Meta',
      target_amount: 10000,
      current_amount: 0,
      category: 'Investimento',
      priority: 'medium',
      goal_type: 'investment',
      auto_contribute: false,
    }

    vi.mocked(apiClient.createFinancialGoal).mockResolvedValue(mockNewGoal as any)

    const { result } = renderHook(() => useFinancialGoals())

    await waitFor(async () => {
      const newGoal = await result.current.createGoal({
        title: 'Nova Meta',
        target_amount: 10000,
        category: 'Investimento',
        priority: 'medium',
        goal_type: 'investment',
        auto_contribute: false,
      })

      expect(newGoal).toEqual(mockNewGoal)
      expect(apiClient.createFinancialGoal).toHaveBeenCalledWith({
        title: 'Nova Meta',
        target_amount: 10000,
        category: 'Investimento',
        priority: 'medium',
        goal_type: 'investment',
        auto_contribute: false,
      })
    })
  })

  it('should update a goal', async () => {
    const mockUpdatedGoal = { ...mockGoals[0], title: 'Meta Atualizada' }
    vi.mocked(apiClient.updateFinancialGoal).mockResolvedValue(mockUpdatedGoal as any)

    const { result } = renderHook(() => useFinancialGoals())

    await waitFor(async () => {
      const updatedGoal = await result.current.updateGoal(1, { title: 'Meta Atualizada' })

      expect(updatedGoal).toEqual(mockUpdatedGoal)
      expect(apiClient.updateFinancialGoal).toHaveBeenCalledWith(1, { title: 'Meta Atualizada' })
    })
  })

  it('should delete a goal', async () => {
    vi.mocked(apiClient.deleteFinancialGoal).mockResolvedValue(undefined)

    const { result } = renderHook(() => useFinancialGoals())

    await waitFor(async () => {
      await result.current.deleteGoal(1)

      expect(apiClient.deleteFinancialGoal).toHaveBeenCalledWith(1)
    })
  })

  it('should add contribution to a goal', async () => {
    const mockContribution = {
      id: 1,
      goal_id: 1,
      user_id: 'user-1',
      amount: 1000,
      contribution_date: '2024-01-15',
      is_automatic: false,
      created_at: '2024-01-15T00:00:00Z',
    }

    vi.mocked(apiClient.addGoalContribution).mockResolvedValue(mockContribution as any)

    const { result } = renderHook(() => useFinancialGoals())

    await waitFor(async () => {
      const contribution = await result.current.addContribution(1, 1000, 'Contribuição mensal')

      expect(contribution).toEqual(mockContribution)
      expect(apiClient.addGoalContribution).toHaveBeenCalledWith(1, 1000, 'Contribuição mensal')
    })
  })
})

describe('useGoalAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return analytics data', () => {
    const { result } = renderHook(() => useGoalAnalytics())

    expect(result.current.analytics).toEqual(mockAnalytics)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should calculate correct progress percentage', () => {
    const { result } = renderHook(() => useGoalAnalytics())

    expect(result.current.analytics?.overall_progress).toBe(44.44)
    expect(result.current.analytics?.goals_on_track).toBe(1)
    expect(result.current.analytics?.goals_behind_schedule).toBe(1)
  })

  it('should show correct goal counts', () => {
    const { result } = renderHook(() => useGoalAnalytics())

    expect(result.current.analytics?.total_goals).toBe(2)
    expect(result.current.analytics?.active_goals).toBe(2)
    expect(result.current.analytics?.completed_goals).toBe(0)
  })
})
