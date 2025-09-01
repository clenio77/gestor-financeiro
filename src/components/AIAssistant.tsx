'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'
import { aiAdvisor, ChatMessage, AIRecommendation, UserProfile } from '@/lib/ai-advisor'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  TrendingUp, 
  Shield, 
  Target,
  X,
  Minimize2,
  Maximize2,
  Settings,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

interface AIAssistantProps {
  isOpen: boolean
  onToggle: () => void
  userProfile?: UserProfile
}

export function AIAssistant({ isOpen, onToggle, userProfile }: AIAssistantProps) {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'recommendations' | 'insights'>('chat')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (userProfile) {
      aiAdvisor.setUserProfile(userProfile)
    }
    loadData()
  }, [userProfile])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const loadData = () => {
    setMessages(aiAdvisor.getChatHistory())
    setRecommendations(aiAdvisor.getRecommendations())
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    setIsTyping(true)
    try {
      const response = await aiAdvisor.sendMessage(inputMessage.trim())
      setMessages(aiAdvisor.getChatHistory())
      setInputMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleRecommendationAction = (recommendationId: string, action: 'accept' | 'reject' | 'implement') => {
    switch (action) {
      case 'accept':
        aiAdvisor.acceptRecommendation(recommendationId)
        break
      case 'reject':
        aiAdvisor.rejectRecommendation(recommendationId)
        break
      case 'implement':
        aiAdvisor.markRecommendationImplemented(recommendationId)
        break
    }
    setRecommendations(aiAdvisor.getRecommendations())
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'investment': return <TrendingUp className="h-4 w-4" />
      case 'savings': return <Shield className="h-4 w-4" />
      case 'goal': return <Target className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getRecommendationColor = (impact: string, urgency: string) => {
    if (urgency === 'high') return 'text-red-600 bg-red-50 border-red-200'
    if (impact === 'high') return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Olá! Sou seu Assistente Financeiro IA
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Estou aqui para ajudar com investimentos, orçamento, metas e muito mais!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-700 text-blue-400'
                      : 'bg-gray-100 text-blue-600'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                </div>

                {/* Message */}
                <div className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-200'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`block w-full text-left text-xs px-2 py-1 rounded border transition-colors ${
                            isDark
                              ? 'border-gray-600 hover:bg-gray-600 text-gray-300'
                              : 'border-gray-300 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex mr-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-gray-700 text-blue-400' : 'bg-gray-100 text-blue-600'
              }`}>
                <Bot className="h-4 w-4" />
              </div>
            </div>
            <div className={`rounded-lg px-4 py-2 ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isDark ? 'bg-gray-400' : 'bg-gray-500'
                }`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isDark ? 'bg-gray-400' : 'bg-gray-500'
                }`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isDark ? 'bg-gray-400' : 'bg-gray-500'
                }`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre finanças..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !inputMessage.trim() || isTyping
                ? isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderRecommendationsTab = () => (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recomendações Personalizadas
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
        }`}>
          {recommendations.filter(r => r.status === 'pending').length} pendentes
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Configure seu perfil para receber recomendações personalizadas
          </p>
        </div>
      ) : (
        recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getRecommendationIcon(rec.type)}
                <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {rec.title}
                </h4>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`text-xs px-2 py-1 rounded-full ${getRecommendationColor(rec.impact, rec.urgency)}`}>
                  {rec.urgency === 'high' ? 'Urgente' : rec.impact === 'high' ? 'Alto Impacto' : 'Baixa Prioridade'}
                </span>
              </div>
            </div>

            <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {rec.description}
            </p>

            <div className={`text-xs mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Por que:</strong> {rec.reasoning}
            </div>

            {rec.estimatedBenefit > 0 && (
              <div className={`text-xs mb-3 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                <strong>Benefício estimado:</strong> R$ {rec.estimatedBenefit.toLocaleString('pt-BR')}
              </div>
            )}

            <div className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <strong>Tempo para implementar:</strong> {rec.timeToImplement}
            </div>

            {rec.status === 'pending' && (
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => handleRecommendationAction(rec.id, 'accept')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Aceitar
                </button>
                <button
                  onClick={() => handleRecommendationAction(rec.id, 'reject')}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Rejeitar
                </button>
              </div>
            )}

            {rec.status === 'accepted' && (
              <button
                onClick={() => handleRecommendationAction(rec.id, 'implement')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center mt-3"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Marcar como Implementado
              </button>
            )}

            {rec.status === 'implemented' && (
              <div className="flex items-center justify-center mt-3 text-green-600 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Implementado
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  const renderInsightsTab = () => (
    <div className="p-4 space-y-4 overflow-y-auto">
      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Insights Financeiros
      </h3>
      
      <div className="space-y-3">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
              Análise de Risco
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Seu perfil de risco está balanceado. Considere diversificar mais seus investimentos.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-800'}`}>
              Tendência Positiva
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>
            Seus gastos estão 15% menores que o mês passado. Continue assim!
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
              Atenção
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
            Sua reserva de emergência está abaixo do recomendado. Considere aumentá-la.
          </p>
        </div>
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className={`fixed ${isMobile ? 'inset-0' : 'bottom-4 right-4'} z-50`}>
      <div className={`${
        isMobile 
          ? 'w-full h-full' 
          : isMinimized 
          ? 'w-80 h-16' 
          : 'w-96 h-[600px]'
      } ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border rounded-lg shadow-xl flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Bot className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Assistente IA
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onToggle}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Tabs */}
            <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {[
                { key: 'chat', label: 'Chat', icon: MessageCircle },
                { key: 'recommendations', label: 'Dicas', icon: Lightbulb },
                { key: 'insights', label: 'Insights', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-1 py-3 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? isDark
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/10'
                        : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && renderChatTab()}
              {activeTab === 'recommendations' && renderRecommendationsTab()}
              {activeTab === 'insights' && renderInsightsTab()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
