import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AuthLayout from '../AuthLayout'

// Mock the hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com' },
    logout: vi.fn(),
  }),
  useRequireAuth: () => ({
    user: { id: 1, email: 'test@example.com' },
    loading: false,
  }),
}))

vi.mock('@/components/PWAProvider', () => ({
  usePWAContext: () => ({
    isInstallable: false,
    installApp: vi.fn(),
  }),
}))

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children content', () => {
    render(
      <AuthLayout title="Test Page">
        <div data-testid="test-content">Test Content</div>
      </AuthLayout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should display page title', () => {
    render(
      <AuthLayout title="Dashboard">
        <div>Content</div>
      </AuthLayout>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('should display user email', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )

    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Transações')).toBeInTheDocument()
    expect(screen.getByText('Contas')).toBeInTheDocument()
    expect(screen.getByText('Orçamentos')).toBeInTheDocument()
    expect(screen.getByText('OCR Upload')).toBeInTheDocument()
    expect(screen.getByText('Análise PDF')).toBeInTheDocument()
  })

  it('should show mobile menu button', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )

    const menuButton = screen.getByRole('button')
    expect(menuButton).toBeInTheDocument()
  })

  it('should display user initials', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )

    // Should show first letter of email
    expect(screen.getByText('T')).toBeInTheDocument()
  })
})

describe('AuthLayout - Loading State', () => {
  it('should show loading spinner when loading', () => {
    vi.mocked(vi.importActual('@/hooks/useAuth')).useRequireAuth = () => ({
      user: null,
      loading: true,
    })

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('AuthLayout - PWA Features', () => {
  it('should show install button when app is installable', () => {
    vi.mocked(vi.importActual('@/components/PWAProvider')).usePWAContext = () => ({
      isInstallable: true,
      installApp: vi.fn(),
    })

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )

    expect(screen.getByText('Instalar App')).toBeInTheDocument()
  })

  it('should call installApp when install button is clicked', () => {
    const mockInstallApp = vi.fn()
    
    vi.mocked(vi.importActual('@/components/PWAProvider')).usePWAContext = () => ({
      isInstallable: true,
      installApp: mockInstallApp,
    })

    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    )

    const installButton = screen.getByText('Instalar App')
    fireEvent.click(installButton)

    expect(mockInstallApp).toHaveBeenCalled()
  })
})
