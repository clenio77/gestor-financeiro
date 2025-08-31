'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import ClientOnly from '@/components/ClientOnly'
import { ThemeToggle, AccessibilityControls, useTheme } from '@/components/ThemeProvider'
import { notificationManager, AlertRule } from '@/lib/notifications'
import { useGoalAlerts } from '@/hooks/useFinancialData'

// Disable SSG for this page to avoid theme provider issues
export const dynamic = 'force-dynamic'
import { 
  Bell, 
  Moon, 
  Sun, 
  Monitor, 
  Shield, 
  Smartphone, 
  Mail, 
  Settings as SettingsIcon,
  Save,
  TestTube,
  Volume2,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <AuthLayout title="Configurações">
      <ClientOnly fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <SettingsContent />
      </ClientOnly>
    </AuthLayout>
  )
}

function SettingsContent() {
  const { theme, isDark, reduceMotion, highContrast } = useTheme()
  const { alerts, unreadCount } = useGoalAlerts()
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [testNotificationSent, setTestNotificationSent] = useState(false)

  useEffect(() => {
    // Load alert rules
    setAlertRules(notificationManager.getAlertRules())
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const handleAlertRuleToggle = (ruleId: string, enabled: boolean) => {
    notificationManager.updateAlertRule(ruleId, { enabled })
    setAlertRules(notificationManager.getAlertRules())
  }

  const handleAlertRuleUpdate = (ruleId: string, updates: Partial<AlertRule>) => {
    notificationManager.updateAlertRule(ruleId, updates)
    setAlertRules(notificationManager.getAlertRules())
  }

  const requestNotificationPermission = async () => {
    const permission = await notificationManager.requestPermission()
    setNotificationPermission(permission)
  }

  const sendTestNotification = async () => {
    await notificationManager.showNotification({
      title: '🧪 Notificação de teste',
      body: 'Se você está vendo isso, as notificações estão funcionando perfeitamente!',
      tag: 'test_notification',
      requireInteraction: false
    })
    setTestNotificationSent(true)
    setTimeout(() => setTestNotificationSent(false), 3000)
  }

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return { text: 'Permitidas', color: 'text-green-600', icon: Bell }
      case 'denied':
        return { text: 'Bloqueadas', color: 'text-red-600', icon: VolumeX }
      default:
        return { text: 'Não solicitadas', color: 'text-yellow-600', icon: Volume2 }
    }
  }

  const permissionStatus = getPermissionStatus()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
            <p className="text-gray-600 dark:text-gray-300">Personalize sua experiência no Gestor Financeiro</p>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            {isDark ? <Moon className="h-6 w-6 text-blue-600" /> : <Sun className="h-6 w-6 text-blue-600" />}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Aparência</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tema
              </label>
              <div className="flex space-x-4">
                <ThemeToggle />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Atual: {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Acessibilidade
              </label>
              <AccessibilityControls />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Monitor className="h-4 w-4" />
                <span>Animações: {reduceMotion ? 'Reduzidas' : 'Normais'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                {highContrast ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>Contraste: {highContrast ? 'Alto' : 'Normal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notificações</h2>
            </div>
            <div className="flex items-center space-x-2">
              <permissionStatus.icon className={`h-5 w-5 ${permissionStatus.color}`} />
              <span className={`text-sm font-medium ${permissionStatus.color}`}>
                {permissionStatus.text}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {notificationPermission !== 'granted' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Notificações não habilitadas
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Permita notificações para receber alertas importantes sobre suas finanças.
                    </p>
                  </div>
                  <button
                    onClick={requestNotificationPermission}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Permitir
                  </button>
                </div>
              </div>
            )}

            {notificationPermission === 'granted' && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Teste de notificação</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Envie uma notificação de teste</p>
                </div>
                <button
                  onClick={sendTestNotification}
                  disabled={testNotificationSent}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    testNotificationSent
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <TestTube className="h-4 w-4" />
                  <span>{testNotificationSent ? 'Enviada!' : 'Testar'}</span>
                </button>
              </div>
            )}

            {/* Alert Rules */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Regras de Alerta</h3>
              <div className="space-y-4">
                {alertRules.map((rule: AlertRule) => (
                  <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tipo: {rule.type} • Frequência: {rule.frequency}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) => handleAlertRuleToggle(rule.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {rule.enabled && (
                      <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {rule.conditions.threshold && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Limite (R$)
                            </label>
                            <input
                              type="number"
                              value={rule.conditions.threshold}
                              onChange={(e) => handleAlertRuleUpdate(rule.id, {
                                conditions: { ...rule.conditions, threshold: Number(e.target.value) }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Canais de notificação
                          </label>
                          <div className="flex space-x-4">
                            {['push', 'email', 'in_app'].map((channel) => (
                              <label key={channel} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={rule.channels.includes(channel as any)}
                                  onChange={(e) => {
                                    const newChannels = e.target.checked
                                      ? [...rule.channels, channel as any]
                                      : rule.channels.filter(c => c !== channel)
                                    handleAlertRuleUpdate(rule.id, { channels: newChannels })
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {channel === 'push' ? 'Push' : channel === 'email' ? 'Email' : 'No app'}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alertas Recentes</h2>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
                  {unreadCount} não lidos
                </span>
              )}
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.is_read
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                      : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {new Date(alert.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      alert.severity === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Save className="h-5 w-5" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>
  )
}
