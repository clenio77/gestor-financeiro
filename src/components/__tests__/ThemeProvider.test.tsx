import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme, ThemeToggle, AccessibilityControls } from '../ThemeProvider'

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="next-themes-provider">{children}</div>,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
    resolvedTheme: 'light',
    themes: ['light', 'dark', 'system'],
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Test component that uses the theme
function TestComponent() {
  const { theme, isDark, isLight, isSystem, toggleTheme, reduceMotion, highContrast } = useTheme()
  
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="is-dark">{isDark.toString()}</span>
      <span data-testid="is-light">{isLight.toString()}</span>
      <span data-testid="is-system">{isSystem.toString()}</span>
      <span data-testid="reduce-motion">{reduceMotion.toString()}</span>
      <span data-testid="high-contrast">{highContrast.toString()}</span>
      <button onClick={toggleTheme} data-testid="toggle-theme">
        Toggle Theme
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should render children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide theme context', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(screen.getByTestId('is-light')).toHaveTextContent('true')
    expect(screen.getByTestId('is-dark')).toHaveTextContent('false')
  })

  it('should load accessibility preferences from localStorage', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'reduce-motion') return 'true'
      if (key === 'high-contrast') return 'true'
      return null
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('reduce-motion')).toHaveTextContent('true')
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true')
    })
  })

  it('should detect system preferences when no localStorage values', async () => {
    // Mock system preference for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('reduce-motion')).toHaveTextContent('true')
    })
  })
})

describe('ThemeToggle', () => {
  it('should render theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Modo claro')
  })

  it('should show correct icon and label for light theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    expect(screen.getByText('☀️')).toBeInTheDocument()
    expect(screen.getByText('Modo claro')).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Modo claro')
    expect(button).toHaveAttribute('title', 'Modo claro')
  })
})

describe('AccessibilityControls', () => {
  it('should render accessibility controls', () => {
    render(
      <ThemeProvider>
        <AccessibilityControls />
      </ThemeProvider>
    )

    expect(screen.getByLabelText('Reduzir animações')).toBeInTheDocument()
    expect(screen.getByLabelText('Alto contraste')).toBeInTheDocument()
  })

  it('should have proper form controls', () => {
    render(
      <ThemeProvider>
        <AccessibilityControls />
      </ThemeProvider>
    )

    const reduceMotionCheckbox = screen.getByLabelText('Reduzir animações')
    const highContrastCheckbox = screen.getByLabelText('Alto contraste')

    expect(reduceMotionCheckbox).toHaveAttribute('type', 'checkbox')
    expect(highContrastCheckbox).toHaveAttribute('type', 'checkbox')
    expect(reduceMotionCheckbox).toHaveAttribute('id', 'reduce-motion')
    expect(highContrastCheckbox).toHaveAttribute('id', 'high-contrast')
  })

  it('should update preferences when checkboxes are clicked', async () => {
    render(
      <ThemeProvider>
        <AccessibilityControls />
        <TestComponent />
      </ThemeProvider>
    )

    const reduceMotionCheckbox = screen.getByLabelText('Reduzir animações')
    
    fireEvent.click(reduceMotionCheckbox)

    await waitFor(() => {
      expect(screen.getByTestId('reduce-motion')).toHaveTextContent('true')
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('reduce-motion', 'true')
  })
})

describe('useTheme hook', () => {
  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })

  it('should provide all theme utilities', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Check that all theme utilities are available
    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    expect(screen.getByTestId('is-dark')).toBeInTheDocument()
    expect(screen.getByTestId('is-light')).toBeInTheDocument()
    expect(screen.getByTestId('is-system')).toBeInTheDocument()
    expect(screen.getByTestId('reduce-motion')).toBeInTheDocument()
    expect(screen.getByTestId('high-contrast')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-theme')).toBeInTheDocument()
  })
})

describe('Theme persistence', () => {
  it('should save accessibility preferences to localStorage', async () => {
    render(
      <ThemeProvider>
        <AccessibilityControls />
      </ThemeProvider>
    )

    const reduceMotionCheckbox = screen.getByLabelText('Reduzir animações')
    const highContrastCheckbox = screen.getByLabelText('Alto contraste')

    fireEvent.click(reduceMotionCheckbox)
    fireEvent.click(highContrastCheckbox)

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('reduce-motion', 'true')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('high-contrast', 'true')
    })
  })

  it('should apply CSS classes based on preferences', async () => {
    const mockDocumentElement = {
      classList: {
        toggle: vi.fn(),
      },
    }

    Object.defineProperty(document, 'documentElement', {
      value: mockDocumentElement,
      writable: true,
    })

    render(
      <ThemeProvider>
        <AccessibilityControls />
      </ThemeProvider>
    )

    const reduceMotionCheckbox = screen.getByLabelText('Reduzir animações')
    fireEvent.click(reduceMotionCheckbox)

    await waitFor(() => {
      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledWith('reduce-motion', true)
    })
  })
})
