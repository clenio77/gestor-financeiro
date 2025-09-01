// Advanced Export Manager
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ExportConfig {
  id: string
  name: string
  format: 'excel' | 'csv' | 'json' | 'xml'
  dataSource: 'transactions' | 'accounts' | 'budgets' | 'goals' | 'reports' | 'custom'
  filters: ExportFilters
  columns: ExportColumn[]
  formatting: ExportFormatting
  schedule?: ExportSchedule
  isActive: boolean
  createdAt: Date
  lastExported?: Date
}

export interface ExportFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  categories?: string[]
  accounts?: string[]
  amountRange?: {
    min: number
    max: number
  }
  tags?: string[]
  status?: string[]
  customFilters?: { [key: string]: any }
}

export interface ExportColumn {
  key: string
  title: string
  type: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'percentage'
  format?: string
  width?: number
  visible: boolean
  sortable: boolean
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface ExportFormatting {
  includeHeaders: boolean
  includeFooters: boolean
  includeSummary: boolean
  dateFormat: string
  currencyFormat: string
  numberFormat: string
  sheetName?: string
  styling?: {
    headerStyle?: any
    dataStyle?: any
    summaryStyle?: any
  }
}

export interface ExportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  recipients: string[]
  isActive: boolean
  nextRun?: Date
}

export interface ExportResult {
  id: string
  configId: string
  filename: string
  format: string
  data: Uint8Array | string
  size: number
  recordCount: number
  exportedAt: Date
  filters: ExportFilters
  metadata: {
    totalRecords: number
    filteredRecords: number
    exportTime: number
    columns: number
  }
}

class ExportManager {
  private static instance: ExportManager
  private configs: Map<string, ExportConfig> = new Map()
  private exports: ExportResult[] = []

  private constructor() {
    this.initializeDefaultConfigs()
    this.loadConfigs()
  }

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager()
    }
    return ExportManager.instance
  }

  private initializeDefaultConfigs(): void {
    const defaultConfigs: Omit<ExportConfig, 'id' | 'createdAt'>[] = [
      {
        name: 'Transações Completas',
        format: 'excel',
        dataSource: 'transactions',
        filters: {
          dateRange: {
            start: new Date(new Date().getFullYear(), 0, 1),
            end: new Date()
          }
        },
        columns: [
          { key: 'date', title: 'Data', type: 'date', visible: true, sortable: true, width: 15 },
          { key: 'description', title: 'Descrição', type: 'text', visible: true, sortable: true, width: 30 },
          { key: 'category', title: 'Categoria', type: 'text', visible: true, sortable: true, width: 20 },
          { key: 'amount', title: 'Valor', type: 'currency', visible: true, sortable: true, width: 15, aggregation: 'sum' },
          { key: 'account', title: 'Conta', type: 'text', visible: true, sortable: true, width: 20 },
          { key: 'type', title: 'Tipo', type: 'text', visible: true, sortable: true, width: 10 }
        ],
        formatting: {
          includeHeaders: true,
          includeFooters: true,
          includeSummary: true,
          dateFormat: 'dd/MM/yyyy',
          currencyFormat: 'R$ #,##0.00',
          numberFormat: '#,##0.00',
          sheetName: 'Transações'
        },
        isActive: true
      },
      {
        name: 'Resumo por Categoria',
        format: 'excel',
        dataSource: 'transactions',
        filters: {
          dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            end: new Date()
          }
        },
        columns: [
          { key: 'category', title: 'Categoria', type: 'text', visible: true, sortable: true, width: 25 },
          { key: 'count', title: 'Quantidade', type: 'number', visible: true, sortable: true, width: 15 },
          { key: 'total', title: 'Total', type: 'currency', visible: true, sortable: true, width: 20 },
          { key: 'average', title: 'Média', type: 'currency', visible: true, sortable: true, width: 20 },
          { key: 'percentage', title: 'Percentual', type: 'percentage', visible: true, sortable: true, width: 15 }
        ],
        formatting: {
          includeHeaders: true,
          includeFooters: true,
          includeSummary: true,
          dateFormat: 'dd/MM/yyyy',
          currencyFormat: 'R$ #,##0.00',
          numberFormat: '#,##0.00',
          sheetName: 'Resumo por Categoria'
        },
        isActive: true
      }
    ]

    defaultConfigs.forEach(config => {
      const fullConfig: ExportConfig = {
        ...config,
        id: this.generateConfigId(),
        createdAt: new Date()
      }
      this.configs.set(fullConfig.id, fullConfig)
    })
  }

  private loadConfigs(): void {
    try {
      const stored = localStorage.getItem('export_configs')
      if (stored) {
        const configs = JSON.parse(stored)
        configs.forEach((config: any) => {
          this.configs.set(config.id, {
            ...config,
            createdAt: new Date(config.createdAt),
            lastExported: config.lastExported ? new Date(config.lastExported) : undefined,
            filters: {
              ...config.filters,
              dateRange: config.filters.dateRange ? {
                start: new Date(config.filters.dateRange.start),
                end: new Date(config.filters.dateRange.end)
              } : undefined
            }
          })
        })
      }
    } catch (error) {
      console.error('Failed to load export configs:', error)
    }
  }

  private saveConfigs(): void {
    try {
      const configs = Array.from(this.configs.values())
      localStorage.setItem('export_configs', JSON.stringify(configs))
    } catch (error) {
      console.error('Failed to save export configs:', error)
    }
  }

  // Public API methods
  async exportData(configId: string, data: any[]): Promise<ExportResult> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Export config ${configId} not found`)
    }

    const startTime = Date.now()
    
    try {
      // Apply filters
      const filteredData = this.applyFilters(data, config.filters)
      
      // Process data according to config
      const processedData = this.processData(filteredData, config)
      
      // Generate export based on format
      let exportData: Uint8Array | string
      let filename: string
      
      switch (config.format) {
        case 'excel':
          exportData = await this.generateExcel(processedData, config)
          filename = `${config.name}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`
          break
        case 'csv':
          exportData = await this.generateCSV(processedData, config)
          filename = `${config.name}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`
          break
        case 'json':
          exportData = JSON.stringify(processedData, null, 2)
          filename = `${config.name}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`
          break
        case 'xml':
          exportData = this.generateXML(processedData, config)
          filename = `${config.name}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xml`
          break
        default:
          throw new Error(`Unsupported format: ${config.format}`)
      }

      const result: ExportResult = {
        id: this.generateExportId(),
        configId,
        filename,
        format: config.format,
        data: exportData,
        size: exportData instanceof Uint8Array ? exportData.length : exportData.length,
        recordCount: processedData.length,
        exportedAt: new Date(),
        filters: config.filters,
        metadata: {
          totalRecords: data.length,
          filteredRecords: filteredData.length,
          exportTime: Date.now() - startTime,
          columns: config.columns.filter(c => c.visible).length
        }
      }

      // Update last exported timestamp
      config.lastExported = new Date()
      this.saveConfigs()

      // Store export result
      this.exports.unshift(result)
      if (this.exports.length > 50) {
        this.exports = this.exports.slice(0, 50) // Keep only last 50 exports
      }

      return result
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  private applyFilters(data: any[], filters: ExportFilters): any[] {
    let filtered = [...data]

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= filters.dateRange!.start && itemDate <= filters.dateRange!.end
      })
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(item => filters.categories!.includes(item.category))
    }

    // Accounts filter
    if (filters.accounts && filters.accounts.length > 0) {
      filtered = filtered.filter(item => filters.accounts!.includes(item.account))
    }

    // Amount range filter
    if (filters.amountRange) {
      filtered = filtered.filter(item => {
        const amount = Math.abs(item.amount)
        return amount >= filters.amountRange!.min && amount <= filters.amountRange!.max
      })
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item => 
        item.tags && filters.tags!.some(tag => item.tags.includes(tag))
      )
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(item => filters.status!.includes(item.status))
    }

    // Custom filters
    if (filters.customFilters) {
      Object.entries(filters.customFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filtered = filtered.filter(item => item[key] === value)
        }
      })
    }

    return filtered
  }

  private processData(data: any[], config: ExportConfig): any[] {
    const visibleColumns = config.columns.filter(col => col.visible)
    
    return data.map(item => {
      const processedItem: any = {}
      
      visibleColumns.forEach(column => {
        let value = item[column.key]
        
        // Format value based on column type
        switch (column.type) {
          case 'date':
            value = value ? format(new Date(value), config.formatting.dateFormat, { locale: ptBR }) : ''
            break
          case 'currency':
            value = typeof value === 'number' ? this.formatCurrency(value) : value
            break
          case 'percentage':
            value = typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value
            break
          case 'number':
            value = typeof value === 'number' ? value.toLocaleString('pt-BR') : value
            break
          case 'boolean':
            value = value ? 'Sim' : 'Não'
            break
        }
        
        processedItem[column.title] = value
      })
      
      return processedItem
    })
  }

  private async generateExcel(data: any[], config: ExportConfig): Promise<Uint8Array> {
    const workbook = XLSX.utils.book_new()
    
    // Create main data sheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Apply column widths
    const visibleColumns = config.columns.filter(col => col.visible)
    worksheet['!cols'] = visibleColumns.map(col => ({ width: col.width || 15 }))
    
    // Add summary if requested
    if (config.formatting.includeSummary) {
      const summaryData = this.generateSummary(data, config)
      if (summaryData.length > 0) {
        // Add empty row
        const emptyRow: any = {}
        visibleColumns.forEach(col => {
          emptyRow[col.title] = ''
        })
        data.push(emptyRow)
        
        // Add summary rows
        summaryData.forEach(row => data.push(row))
        
        // Recreate worksheet with summary
        const worksheetWithSummary = XLSX.utils.json_to_sheet(data)
        worksheetWithSummary['!cols'] = worksheet['!cols']
        XLSX.utils.book_append_sheet(workbook, worksheetWithSummary, config.formatting.sheetName || 'Dados')
      } else {
        XLSX.utils.book_append_sheet(workbook, worksheet, config.formatting.sheetName || 'Dados')
      }
    } else {
      XLSX.utils.book_append_sheet(workbook, worksheet, config.formatting.sheetName || 'Dados')
    }
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Uint8Array(excelBuffer)
  }

  private async generateCSV(data: any[], config: ExportConfig): Promise<string> {
    const visibleColumns = config.columns.filter(col => col.visible)
    
    let csvContent = ''
    
    // Add headers if requested
    if (config.formatting.includeHeaders) {
      const headers = visibleColumns.map(col => `"${col.title}"`)
      csvContent += headers.join(',') + '\n'
    }
    
    // Add data rows
    data.forEach(row => {
      const values = visibleColumns.map(col => {
        const value = row[col.title] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      })
      csvContent += values.join(',') + '\n'
    })
    
    // Add summary if requested
    if (config.formatting.includeSummary) {
      const summaryData = this.generateSummary(data, config)
      if (summaryData.length > 0) {
        csvContent += '\n' // Empty line
        summaryData.forEach(row => {
          const values = visibleColumns.map(col => {
            const value = row[col.title] || ''
            return `"${String(value).replace(/"/g, '""')}"`
          })
          csvContent += values.join(',') + '\n'
        })
      }
    }
    
    return csvContent
  }

  private generateXML(data: any[], config: ExportConfig): string {
    const visibleColumns = config.columns.filter(col => col.visible)
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += `<export name="${config.name}" generated="${new Date().toISOString()}">\n`
    xml += '  <data>\n'
    
    data.forEach(row => {
      xml += '    <record>\n'
      visibleColumns.forEach(col => {
        const value = row[col.title] || ''
        const escapedValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
        xml += `      <${col.key}>${escapedValue}</${col.key}>\n`
      })
      xml += '    </record>\n'
    })
    
    xml += '  </data>\n'
    xml += '</export>'
    
    return xml
  }

  private generateSummary(data: any[], config: ExportConfig): any[] {
    const summaryRows: any[] = []
    const visibleColumns = config.columns.filter(col => col.visible)
    const aggregationColumns = visibleColumns.filter(col => col.aggregation)
    
    if (aggregationColumns.length === 0) return summaryRows
    
    const summaryRow: any = {}
    
    // Initialize summary row
    visibleColumns.forEach(col => {
      summaryRow[col.title] = ''
    })
    
    // Set first column as label
    if (visibleColumns.length > 0) {
      summaryRow[visibleColumns[0].title] = 'TOTAL'
    }
    
    // Calculate aggregations
    aggregationColumns.forEach(col => {
      const values = data.map(row => {
        const value = row[col.title]
        return typeof value === 'string' && value.includes('R$') 
          ? parseFloat(value.replace(/[R$\s.,]/g, '').replace(',', '.')) || 0
          : typeof value === 'number' ? value : 0
      }).filter(v => !isNaN(v))
      
      if (values.length === 0) return
      
      let result = 0
      switch (col.aggregation) {
        case 'sum':
          result = values.reduce((sum, val) => sum + val, 0)
          break
        case 'avg':
          result = values.reduce((sum, val) => sum + val, 0) / values.length
          break
        case 'count':
          result = values.length
          break
        case 'min':
          result = Math.min(...values)
          break
        case 'max':
          result = Math.max(...values)
          break
      }
      
      summaryRow[col.title] = col.type === 'currency' ? this.formatCurrency(result) : result
    })
    
    summaryRows.push(summaryRow)
    return summaryRows
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Configuration management
  createConfig(config: Omit<ExportConfig, 'id' | 'createdAt'>): ExportConfig {
    const newConfig: ExportConfig = {
      ...config,
      id: this.generateConfigId(),
      createdAt: new Date()
    }

    this.configs.set(newConfig.id, newConfig)
    this.saveConfigs()
    return newConfig
  }

  updateConfig(configId: string, updates: Partial<ExportConfig>): void {
    const config = this.configs.get(configId)
    if (config) {
      Object.assign(config, updates)
      this.saveConfigs()
    }
  }

  deleteConfig(configId: string): void {
    this.configs.delete(configId)
    this.saveConfigs()
  }

  getConfigs(): ExportConfig[] {
    return Array.from(this.configs.values())
  }

  getExports(): ExportResult[] {
    return [...this.exports]
  }

  // Utility methods
  downloadExport(exportResult: ExportResult): void {
    const blob = new Blob([exportResult.data as BlobPart], {
      type: this.getContentType(exportResult.format)
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportResult.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case 'csv': return 'text/csv'
      case 'json': return 'application/json'
      case 'xml': return 'application/xml'
      default: return 'application/octet-stream'
    }
  }

  private generateConfigId(): string {
    return `export_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const exportManager = ExportManager.getInstance()
