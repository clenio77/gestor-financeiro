import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('Home Page', () => {
  it('should render the main heading', () => {
    render(<Home />)
    
    expect(screen.getByText('Gestão Financeira')).toBeInTheDocument()
    expect(screen.getByText('Inteligente')).toBeInTheDocument()
  })

  it('should render the hero description', () => {
    render(<Home />)
    
    expect(screen.getByText(/Controle suas finanças com o poder da Inteligência Artificial/)).toBeInTheDocument()
    expect(screen.getByText(/OCR para extrair dados de recibos/)).toBeInTheDocument()
  })

  it('should render call-to-action buttons', () => {
    render(<Home />)
    
    expect(screen.getByText('Começar Gratuitamente')).toBeInTheDocument()
    expect(screen.getByText('Já tenho conta')).toBeInTheDocument()
  })

  it('should render feature cards', () => {
    render(<Home />)
    
    expect(screen.getByText('IA Avançada')).toBeInTheDocument()
    expect(screen.getByText('OCR Automático')).toBeInTheDocument()
    expect(screen.getByText('Seguro')).toBeInTheDocument()
    expect(screen.getByText('PWA')).toBeInTheDocument()
  })

  it('should render feature descriptions', () => {
    render(<Home />)
    
    expect(screen.getByText(/Análise inteligente de gastos/)).toBeInTheDocument()
    expect(screen.getByText(/Extraia dados de recibos e notas fiscais/)).toBeInTheDocument()
    expect(screen.getByText(/Seus dados financeiros protegidos/)).toBeInTheDocument()
    expect(screen.getByText(/Acesse offline, instale como app nativo/)).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    render(<Home />)
    
    const loginLinks = screen.getAllByText('Entrar')
    const registerLinks = screen.getAllByText(/Cadastrar|Criar Conta/)
    
    expect(loginLinks.length).toBeGreaterThan(0)
    expect(registerLinks.length).toBeGreaterThan(0)
  })

  it('should render the logo', () => {
    render(<Home />)
    
    expect(screen.getByText('GF')).toBeInTheDocument()
    expect(screen.getByText('Gestor Financeiro')).toBeInTheDocument()
  })

  it('should render the final CTA section', () => {
    render(<Home />)
    
    expect(screen.getByText('Pronto para transformar suas finanças?')).toBeInTheDocument()
    expect(screen.getByText(/Junte-se a milhares de usuários/)).toBeInTheDocument()
  })

  it('should render the footer', () => {
    render(<Home />)
    
    expect(screen.getByText(/© 2024 Gestor Financeiro/)).toBeInTheDocument()
    expect(screen.getByText(/Todos os direitos reservados/)).toBeInTheDocument()
  })

  it('should have correct link hrefs', () => {
    render(<Home />)
    
    const loginLinks = screen.getAllByRole('link', { name: /entrar/i })
    const registerLinks = screen.getAllByRole('link', { name: /cadastrar|criar conta/i })
    
    loginLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/login')
    })
    
    registerLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })
})
