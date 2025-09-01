// Advanced Report Generation System
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format as formatDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ReportConfig {
  id: string
  name: string
  description: string
  type: 'financial_summary' | 'transactions' | 'budget_analysis' | 'goals_progress' | 'custom'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  template: ReportTemplate
  filters: ReportFilters
  schedule?: ReportSchedule
  isActive: boolean
  createdAt: Date
  lastGenerated?: Date
}

export interface ReportTemplate {
  id: string
  name: string
  layout: 'portrait' | 'landscape'
  sections: ReportSection[]
  styling: ReportStyling
  branding: ReportBranding
}

export interface ReportSection {
  id: string
  type: 'header' | 'summary' | 'chart' | 'table' | 'text' | 'spacer'
  title?: string
  content?: any
  chartConfig?: ChartConfig
  tableConfig?: TableConfig
  position: { x: number; y: number; width: number; height: number }
  visible: boolean
}

export interface ChartConfig {
  type: 'pie' | 'bar' | 'line' | 'area' | 'donut'
  dataSource: string
  xAxis?: string
  yAxis?: string
  colors?: string[]
  showLegend: boolean
  showValues: boolean
}

export interface TableConfig {
  dataSource: string
  columns: TableColumn[]
  showHeader: boolean
  alternateRows: boolean
  maxRows?: number
}

export interface TableColumn {
  key: string
  title: string
  width?: number
  align: 'left' | 'center' | 'right'
  format?: 'currency' | 'date' | 'percentage' | 'number'
}

export interface ReportStyling {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  fontSize: {
    title: number
    subtitle: number
    body: number
    caption: number
  }
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface ReportBranding {
  logo?: string
  companyName?: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

export interface ReportFilters {
  dateRange: {
    start: Date
    end: Date
  }
  accounts?: string[]
  categories?: string[]
  tags?: string[]
  amountRange?: {
    min: number
    max: number
  }
  transactionTypes?: ('income' | 'expense')[]
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  recipients: string[]
  isActive: boolean
}

export interface GeneratedReport {
  id: string
  configId: string
  name: string
  format: string
  data: Uint8Array | string
  size: number
  generatedAt: Date
  filters: ReportFilters
  metadata: {
    totalRecords: number
    totalPages?: number
    generationTime: number
  }
}

class ReportGenerator {
  private static instance: ReportGenerator
  private configs: Map<string, ReportConfig> = new Map()
  private templates: Map<string, ReportTemplate> = new Map()

  private constructor() {
    this.initializeDefaultTemplates()
    this.loadConfigs()
  }

  static getInstance(): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator()
    }
    return ReportGenerator.instance
  }

  private initializeDefaultTemplates(): void {
    // Financial Summary Template
    const financialSummaryTemplate: ReportTemplate = {
      id: 'financial_summary',
      name: 'Resumo Financeiro',
      layout: 'portrait',
      sections: [
        {
          id: 'header',
          type: 'header',
          title: 'Resumo Financeiro',
          position: { x: 0, y: 0, width: 100, height: 10 },
          visible: true
        },
        {
          id: 'summary_cards',
          type: 'summary',
          position: { x: 0, y: 15, width: 100, height: 20 },
          visible: true
        },
        {
          id: 'expense_chart',
          type: 'chart',
          title: 'Gastos por Categoria',
          chartConfig: {
            type: 'pie',
            dataSource: 'expenses_by_category',
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            showLegend: true,
            showValues: true
          },
          position: { x: 0, y: 40, width: 50, height: 30 },
          visible: true
        },
        {
          id: 'income_trend',
          type: 'chart',
          title: 'Tendência de Receitas',
          chartConfig: {
            type: 'line',
            dataSource: 'income_trend',
            xAxis: 'month',
            yAxis: 'amount',
            colors: ['#4BC0C0'],
            showLegend: false,
            showValues: false
          },
          position: { x: 50, y: 40, width: 50, height: 30 },
          visible: true
        },
        {
          id: 'transactions_table',
          type: 'table',
          title: 'Últimas Transações',
          tableConfig: {
            dataSource: 'recent_transactions',
            columns: [
              { key: 'date', title: 'Data', width: 20, align: 'left', format: 'date' },
              { key: 'description', title: 'Descrição', width: 40, align: 'left' },
              { key: 'category', title: 'Categoria', width: 20, align: 'left' },
              { key: 'amount', title: 'Valor', width: 20, align: 'right', format: 'currency' }
            ],
            showHeader: true,
            alternateRows: true,
            maxRows: 10
          },
          position: { x: 0, y: 75, width: 100, height: 20 },
          visible: true
        }
      ],
      styling: {
        primaryColor: '#2563EB',
        secondaryColor: '#64748B',
        fontFamily: 'Helvetica',
        fontSize: {
          title: 18,
          subtitle: 14,
          body: 10,
          caption: 8
        },
        margins: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      branding: {
        companyName: 'Gestor Financeiro',
        email: 'contato@gestorfinanceiro.com'
      }
    }

    this.templates.set('financial_summary', financialSummaryTemplate)
  }

  private loadConfigs(): void {
    try {
      const stored = localStorage.getItem('report_configs')
      if (stored) {
        const configs = JSON.parse(stored)
        configs.forEach((config: any) => {
          this.configs.set(config.id, {
            ...config,
            createdAt: new Date(config.createdAt),
            lastGenerated: config.lastGenerated ? new Date(config.lastGenerated) : undefined,
            filters: {
              ...config.filters,
              dateRange: {
                start: new Date(config.filters.dateRange.start),
                end: new Date(config.filters.dateRange.end)
              }
            }
          })
        })
      }
    } catch (error) {
      console.error('Failed to load report configs:', error)
    }
  }

  private saveConfigs(): void {
    try {
      const configs = Array.from(this.configs.values())
      localStorage.setItem('report_configs', JSON.stringify(configs))
    } catch (error) {
      console.error('Failed to save report configs:', error)
    }
  }

  // Public API methods
  async generateReport(configId: string, data: any): Promise<GeneratedReport> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Report config ${configId} not found`)
    }

    const startTime = Date.now()
    
    try {
      let reportData: Uint8Array | string
      
      switch (config.format) {
        case 'pdf':
          reportData = await this.generatePDF(config, data)
          break
        case 'excel':
          reportData = await this.generateExcel(config, data)
          break
        case 'csv':
          reportData = await this.generateCSV(config, data)
          break
        case 'json':
          reportData = JSON.stringify(data, null, 2)
          break
        default:
          throw new Error(`Unsupported format: ${config.format}`)
      }

      const generatedReport: GeneratedReport = {
        id: this.generateReportId(),
        configId,
        name: `${config.name}_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss')}`,
        format: config.format,
        data: reportData,
        size: reportData instanceof Uint8Array ? reportData.length : reportData.length,
        generatedAt: new Date(),
        filters: config.filters,
        metadata: {
          totalRecords: this.getTotalRecords(data),
          totalPages: config.format === 'pdf' ? this.calculatePages(data) : undefined,
          generationTime: Date.now() - startTime
        }
      }

      // Update last generated timestamp
      config.lastGenerated = new Date()
      this.saveConfigs()

      return generatedReport
    } catch (error) {
      console.error('Report generation failed:', error)
      throw error
    }
  }

  private async generatePDF(config: ReportConfig, data: any): Promise<Uint8Array> {
    const doc = new jsPDF({
      orientation: config.template.layout,
      unit: 'mm',
      format: 'a4'
    })

    const template = config.template
    const styling = template.styling

    // Set default font
    doc.setFont(styling.fontFamily)

    // Generate each section
    for (const section of template.sections) {
      if (!section.visible) continue

      await this.renderSection(doc, section, data, styling)
    }

    // Add branding footer
    if (template.branding) {
      this.addBrandingFooter(doc, template.branding, styling)
    }

    return new Uint8Array(doc.output('arraybuffer'))
  }

  private async renderSection(
    doc: jsPDF, 
    section: ReportSection, 
    data: any, 
    styling: ReportStyling
  ): Promise<void> {
    const { x, y, width, height } = section.position

    switch (section.type) {
      case 'header':
        this.renderHeader(doc, section, styling, x, y, width)
        break
      case 'summary':
        this.renderSummary(doc, data.summary, styling, x, y, width)
        break
      case 'chart':
        await this.renderChart(doc, section, data, styling, x, y, width, height)
        break
      case 'table':
        this.renderTable(doc, section, data, styling, x, y, width)
        break
      case 'text':
        this.renderText(doc, section, styling, x, y, width)
        break
    }
  }

  private renderHeader(
    doc: jsPDF, 
    section: ReportSection, 
    styling: ReportStyling, 
    x: number, 
    y: number, 
    width: number
  ): void {
    doc.setFontSize(styling.fontSize.title)
    doc.setTextColor(styling.primaryColor)
    doc.text(section.title || '', x + styling.margins.left, y + styling.margins.top)
    
    // Add date
    doc.setFontSize(styling.fontSize.body)
    doc.setTextColor(styling.secondaryColor)
    const dateText = formatDate(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    doc.text(dateText, x + styling.margins.left, y + styling.margins.top + 10)
  }

  private renderSummary(
    doc: jsPDF, 
    summary: any, 
    styling: ReportStyling, 
    x: number, 
    y: number, 
    width: number
  ): void {
    if (!summary) return

    const cardWidth = width / 3
    const cards = [
      { title: 'Receitas', value: summary.totalIncome, color: '#10B981' },
      { title: 'Despesas', value: summary.totalExpenses, color: '#EF4444' },
      { title: 'Saldo', value: summary.balance, color: summary.balance >= 0 ? '#10B981' : '#EF4444' }
    ]

    cards.forEach((card, index) => {
      const cardX = x + (index * cardWidth) + styling.margins.left
      const cardY = y + styling.margins.top

      // Card background
      doc.setFillColor(245, 245, 245)
      doc.rect(cardX, cardY, cardWidth - 5, 15, 'F')

      // Title
      doc.setFontSize(styling.fontSize.caption)
      doc.setTextColor(styling.secondaryColor)
      doc.text(card.title, cardX + 2, cardY + 5)

      // Value
      doc.setFontSize(styling.fontSize.subtitle)
      doc.setTextColor(card.color)
      doc.text(this.formatCurrency(card.value), cardX + 2, cardY + 12)
    })
  }

  private async renderChart(
    doc: jsPDF, 
    section: ReportSection, 
    data: any, 
    styling: ReportStyling, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<void> {
    // For now, we'll add a placeholder for charts
    // In a real implementation, you'd generate chart images and embed them
    doc.setFillColor(240, 240, 240)
    doc.rect(x + styling.margins.left, y + styling.margins.top, width - 10, height - 5, 'F')
    
    doc.setFontSize(styling.fontSize.body)
    doc.setTextColor(styling.secondaryColor)
    doc.text(
      section.title || 'Gráfico', 
      x + styling.margins.left + 5, 
      y + styling.margins.top + 10
    )
    
    doc.text(
      '[Gráfico será renderizado aqui]', 
      x + styling.margins.left + 5, 
      y + styling.margins.top + height / 2
    )
  }

  private renderTable(
    doc: jsPDF, 
    section: ReportSection, 
    data: any, 
    styling: ReportStyling, 
    x: number, 
    y: number, 
    width: number
  ): void {
    if (!section.tableConfig || !data[section.tableConfig.dataSource]) return

    const tableData = data[section.tableConfig.dataSource]
    const config = section.tableConfig

    // Prepare table data
    const headers = config.columns.map(col => col.title)
    const rows = tableData.slice(0, config.maxRows || tableData.length).map((row: any) => 
      config.columns.map(col => this.formatCellValue(row[col.key], col.format))
    )

    // Use autoTable plugin
    ;(doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: y + styling.margins.top,
      margin: { left: x + styling.margins.left },
      styles: {
        fontSize: styling.fontSize.body,
        cellPadding: 2
      },
      headStyles: {
        fillColor: styling.primaryColor,
        textColor: 255
      },
      alternateRowStyles: config.alternateRows ? {
        fillColor: [245, 245, 245]
      } : undefined
    })
  }

  private renderText(
    doc: jsPDF, 
    section: ReportSection, 
    styling: ReportStyling, 
    x: number, 
    y: number, 
    width: number
  ): void {
    if (!section.content) return

    doc.setFontSize(styling.fontSize.body)
    doc.setTextColor(styling.secondaryColor)
    
    const lines = doc.splitTextToSize(section.content, width - styling.margins.left - styling.margins.right)
    doc.text(lines, x + styling.margins.left, y + styling.margins.top)
  }

  private addBrandingFooter(doc: jsPDF, branding: ReportBranding, styling: ReportStyling): void {
    const pageHeight = doc.internal.pageSize.height
    const footerY = pageHeight - 20

    doc.setFontSize(styling.fontSize.caption)
    doc.setTextColor(styling.secondaryColor)
    
    if (branding.companyName) {
      doc.text(branding.companyName, styling.margins.left, footerY)
    }
    
    if (branding.email) {
      doc.text(branding.email, styling.margins.left, footerY + 5)
    }
  }

  private async generateExcel(config: ReportConfig, data: any): Promise<Uint8Array> {
    const workbook = XLSX.utils.book_new()

    // Create summary sheet
    if (data.summary) {
      const summaryData = [
        ['Resumo Financeiro'],
        [''],
        ['Receitas', this.formatCurrency(data.summary.totalIncome)],
        ['Despesas', this.formatCurrency(data.summary.totalExpenses)],
        ['Saldo', this.formatCurrency(data.summary.balance)]
      ]
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')
    }

    // Create transactions sheet
    if (data.transactions) {
      const transactionSheet = XLSX.utils.json_to_sheet(data.transactions)
      XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transações')
    }

    // Create categories sheet
    if (data.expenses_by_category) {
      const categorySheet = XLSX.utils.json_to_sheet(data.expenses_by_category)
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categorias')
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Uint8Array(excelBuffer)
  }

  private async generateCSV(config: ReportConfig, data: any): Promise<string> {
    if (!data.transactions) {
      throw new Error('No transaction data available for CSV export')
    }

    const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo']
    const rows = data.transactions.map((tx: any) => [
      formatDate(new Date(tx.date), 'dd/MM/yyyy'),
      tx.description,
      tx.category,
      tx.amount.toString(),
      tx.type
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Helper methods
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  private formatCellValue(value: any, format?: string): string {
    if (value == null) return ''

    switch (format) {
      case 'currency':
        return this.formatCurrency(Number(value))
      case 'date':
        return formatDate(new Date(value), 'dd/MM/yyyy')
      case 'percentage':
        return `${(Number(value) * 100).toFixed(1)}%`
      case 'number':
        return Number(value).toLocaleString('pt-BR')
      default:
        return String(value)
    }
  }

  private getTotalRecords(data: any): number {
    return data.transactions?.length || 0
  }

  private calculatePages(data: any): number {
    // Simple page calculation - in reality this would be more complex
    const recordsPerPage = 50
    const totalRecords = this.getTotalRecords(data)
    return Math.ceil(totalRecords / recordsPerPage)
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public configuration methods
  createConfig(config: Omit<ReportConfig, 'id' | 'createdAt'>): ReportConfig {
    const newConfig: ReportConfig = {
      ...config,
      id: this.generateConfigId(),
      createdAt: new Date()
    }

    this.configs.set(newConfig.id, newConfig)
    this.saveConfigs()
    return newConfig
  }

  updateConfig(configId: string, updates: Partial<ReportConfig>): void {
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

  getConfigs(): ReportConfig[] {
    return Array.from(this.configs.values())
  }

  getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values())
  }

  private generateConfigId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const reportGenerator = ReportGenerator.getInstance()
