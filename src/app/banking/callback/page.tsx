'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { bankingIntegration } from '@/lib/banking-integration'
import { useTheme } from '@/components/ThemeProvider'

export default function BankingCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDark } = useTheme()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processando conexão bancária...')
  const [bankName, setBankName] = useState('')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const bankCode = searchParams.get('bank') || extractBankFromState(state)

      if (error) {
        setStatus('error')
        setMessage(`Erro na autorização: ${error}`)
        return
      }

      if (!code || !state || !bankCode) {
        setStatus('error')
        setMessage('Parâmetros de callback inválidos')
        return
      }

      setMessage('Estabelecendo conexão com o banco...')
      
      const connection = await bankingIntegration.completeConnection(bankCode, code, state)
      
      setBankName(connection.bankName)
      setStatus('success')
      setMessage(`Conexão com ${connection.bankName} estabelecida com sucesso!`)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard?tab=banking')
      }, 3000)

    } catch (error) {
      console.error('Banking callback error:', error)
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Erro desconhecido na conexão')
    }
  }

  const extractBankFromState = (state: string | null): string => {
    // Extract bank code from state parameter if needed
    // This is a simplified implementation
    return state?.split('_')[0] || ''
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        )
      case 'success':
        return (
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return isDark ? 'text-blue-400' : 'text-blue-600'
      case 'success':
        return isDark ? 'text-green-400' : 'text-green-600'
      case 'error':
        return isDark ? 'text-red-400' : 'text-red-600'
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-lg shadow-lg ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {getStatusIcon()}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {status === 'processing' && 'Conectando ao Banco'}
            {status === 'success' && 'Conexão Estabelecida!'}
            {status === 'error' && 'Erro na Conexão'}
          </h1>

          {/* Message */}
          <p className={`text-lg mb-6 ${getStatusColor()}`}>
            {message}
          </p>

          {/* Additional Info */}
          {status === 'success' && bankName && (
            <div className={`p-4 rounded-lg mb-6 ${
              isDark ? 'bg-green-900/20 border border-green-500/30' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  {bankName} conectado com sucesso
                </span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                Suas transações serão sincronizadas automaticamente
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Aguarde enquanto estabelecemos a conexão segura...</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Validando credenciais</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span>Sincronizando contas</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span>Configurando permissões</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {status === 'success' && (
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard?tab=banking')}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Ir para Dashboard
                </button>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Redirecionando automaticamente em alguns segundos...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard?tab=banking')}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Voltar ao Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className={`mt-8 p-3 rounded-lg ${
            isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Conexão Segura
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Seus dados bancários são protegidos por criptografia de ponta a ponta. 
              Nunca armazenamos suas credenciais de login.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
