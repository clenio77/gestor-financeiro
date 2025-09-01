'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { useTheme } from './ThemeProvider'
import { useIsMobile } from '@/hooks/useDevice'

export interface ChartData {
  [key: string]: any
}

export interface ChartConfig {
  type: 'pie' | 'donut' | 'bar' | 'line' | 'area' | 'composed' | 'scatter' | 'radial'
  data: ChartData[]
  title?: string
  subtitle?: string
  xAxisKey?: string
  yAxisKey?: string
  dataKeys?: string[]
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
  showGrid?: boolean
  height?: number
  responsive?: boolean
  animations?: boolean
  customTooltip?: boolean
  drillDown?: boolean
  filters?: ChartFilter[]
}

export interface ChartFilter {
  key: string
  label: string
  type: 'select' | 'range' | 'date'
  options?: { value: any; label: string }[]
  range?: { min: number; max: number }
}

interface AdvancedChartsProps {
  config: ChartConfig
  onDrillDown?: (data: any) => void
  onFilterChange?: (filters: { [key: string]: any }) => void
}

export function AdvancedCharts({ config, onDrillDown, onFilterChange }: AdvancedChartsProps) {
  const { isDark } = useTheme()
  const isMobile = useIsMobile()
  const [filteredData, setFilteredData] = useState(config.data)
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: any }>({})
  const [selectedSegment, setSelectedSegment] = useState<any>(null)

  const colors = config.colors || [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  const darkColors = colors.map(color => {
    // Lighten colors for dark mode
    return color.replace('#', '#').concat('CC')
  })

  const chartColors = isDark ? darkColors : colors

  useEffect(() => {
    applyFilters()
  }, [config.data, activeFilters])

  const applyFilters = () => {
    let filtered = [...config.data]

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const filter = config.filters?.find(f => f.key === key)
        
        if (filter?.type === 'range') {
          filtered = filtered.filter(item => 
            item[key] >= value.min && item[key] <= value.max
          )
        } else if (filter?.type === 'date') {
          const startDate = new Date(value.start)
          const endDate = new Date(value.end)
          filtered = filtered.filter(item => {
            const itemDate = new Date(item[key])
            return itemDate >= startDate && itemDate <= endDate
          })
        } else {
          filtered = filtered.filter(item => item[key] === value)
        }
      }
    })

    setFilteredData(filtered)
  }

  const handleFilterChange = (filterKey: string, value: any) => {
    const newFilters = { ...activeFilters, [filterKey]: value }
    setActiveFilters(newFilters)
    
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const handleSegmentClick = (data: any) => {
    setSelectedSegment(data)
    
    if (config.drillDown && onDrillDown) {
      onDrillDown(data)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    return (
      <div className={`p-3 rounded-lg shadow-lg border ${
        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {label && (
          <p className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {label}
          </p>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {entry.name}:
            </span>
            <span className="font-medium">
              {typeof entry.value === 'number' 
                ? entry.value.toLocaleString('pt-BR', {
                    style: entry.name?.toLowerCase().includes('valor') ? 'currency' : 'decimal',
                    currency: 'BRL'
                  })
                : entry.value
              }
            </span>
          </div>
        ))}
      </div>
    )
  }

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (config.type) {
      case 'pie':
      case 'donut':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={config.type === 'donut' ? 60 : 0}
              outerRadius={80}
              paddingAngle={2}
              dataKey={config.yAxisKey || 'value'}
              onClick={handleSegmentClick}
              className="cursor-pointer"
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={chartColors[index % chartColors.length]}
                  stroke={selectedSegment === entry ? '#fff' : 'none'}
                  strokeWidth={selectedSegment === entry ? 2 : 0}
                />
              ))}
            </Pie>
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  color: isDark ? '#E5E7EB' : '#374151',
                  fontSize: '12px'
                }}
              />
            )}
          </PieChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {config.showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#374151' : '#E5E7EB'} 
              />
            )}
            <XAxis 
              dataKey={config.xAxisKey || 'name'}
              tick={{ fill: isDark ? '#E5E7EB' : '#374151', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
            />
            <YAxis 
              tick={{ fill: isDark ? '#E5E7EB' : '#374151', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
            />
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  color: isDark ? '#E5E7EB' : '#374151',
                  fontSize: '12px'
                }}
              />
            )}
            {config.dataKeys?.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={chartColors[index % chartColors.length]}
                onClick={handleSegmentClick}
                className="cursor-pointer"
                radius={[2, 2, 0, 0]}
              />
            )) || (
              <Bar 
                dataKey={config.yAxisKey || 'value'} 
                fill={chartColors[0]}
                onClick={handleSegmentClick}
                className="cursor-pointer"
                radius={[2, 2, 0, 0]}
              />
            )}
          </BarChart>
        )

      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#374151' : '#E5E7EB'} 
              />
            )}
            <XAxis 
              dataKey={config.xAxisKey || 'name'}
              tick={{ fill: isDark ? '#E5E7EB' : '#374151', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
            />
            <YAxis 
              tick={{ fill: isDark ? '#E5E7EB' : '#374151', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
            />
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  color: isDark ? '#E5E7EB' : '#374151',
                  fontSize: '12px'
                }}
              />
            )}
            {config.dataKeys?.map((key, index) => (
              <Line 
                key={key}
                type="monotone"
                dataKey={key} 
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2}
                dot={{ fill: chartColors[index % chartColors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartColors[index % chartColors.length], strokeWidth: 2 }}
              />
            )) || (
              <Line 
                type="monotone"
                dataKey={config.yAxisKey || 'value'} 
                stroke={chartColors[0]}
                strokeWidth={2}
                dot={{ fill: chartColors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartColors[0], strokeWidth: 2 }}
              />
            )}
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#374151' : '#E5E7EB'} 
              />
            )}
            <XAxis 
              dataKey={config.xAxisKey || 'name'}
              tick={{ fill: isDark ? '#E5E7EB' : '#374151', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
            />
            <YAxis 
              tick={{ fill: isDark ? '#E5E7EB' : '#374151', fontSize: 12 }}
              axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
            />
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  color: isDark ? '#E5E7EB' : '#374151',
                  fontSize: '12px'
                }}
              />
            )}
            {config.dataKeys?.map((key, index) => (
              <Area 
                key={key}
                type="monotone"
                dataKey={key} 
                stackId="1"
                stroke={chartColors[index % chartColors.length]}
                fill={chartColors[index % chartColors.length]}
                fillOpacity={0.6}
              />
            )) || (
              <Area 
                type="monotone"
                dataKey={config.yAxisKey || 'value'} 
                stroke={chartColors[0]}
                fill={chartColors[0]}
                fillOpacity={0.6}
              />
            )}
          </AreaChart>
        )

      case 'radial':
        return (
          <RadialBarChart {...commonProps} innerRadius="10%" outerRadius="80%">
            <RadialBar 
              dataKey={config.yAxisKey || 'value'} 
              cornerRadius={10} 
              fill={chartColors[0]}
            />
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                iconType="line"
                layout="vertical"
                verticalAlign="middle"
                wrapperStyle={{ 
                  color: isDark ? '#E5E7EB' : '#374151',
                  fontSize: '12px'
                }}
              />
            )}
          </RadialBarChart>
        )

      default:
        return <div>Tipo de gráfico não suportado</div>
    }
  }

  return (
    <div className={`p-6 rounded-lg border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      {(config.title || config.subtitle) && (
        <div className="mb-6">
          {config.title && (
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {config.title}
            </h3>
          )}
          {config.subtitle && (
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      {config.filters && config.filters.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-4">
          {config.filters.map(filter => (
            <div key={filter.key} className="flex flex-col">
              <label className={`text-xs font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {filter.label}
              </label>
              
              {filter.type === 'select' && (
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className={`px-3 py-1 text-sm rounded border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Todos</option>
                  {filter.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              
              {filter.type === 'range' && (
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={activeFilters[filter.key]?.min || ''}
                    onChange={(e) => handleFilterChange(filter.key, {
                      ...activeFilters[filter.key],
                      min: Number(e.target.value)
                    })}
                    className={`w-20 px-2 py-1 text-sm rounded border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={activeFilters[filter.key]?.max || ''}
                    onChange={(e) => handleFilterChange(filter.key, {
                      ...activeFilters[filter.key],
                      max: Number(e.target.value)
                    })}
                    className={`w-20 px-2 py-1 text-sm rounded border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ height: config.height || 400 }}>
        {config.responsive ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          renderChart()
        )}
      </div>

      {/* Selected Segment Info */}
      {selectedSegment && (
        <div className={`mt-4 p-3 rounded border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Selecionado:
          </h4>
          <div className="space-y-1">
            {Object.entries(selectedSegment).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {key}:
                </span>
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                  {typeof value === 'number' 
                    ? value.toLocaleString('pt-BR', {
                        style: key.toLowerCase().includes('valor') ? 'currency' : 'decimal',
                        currency: 'BRL'
                      })
                    : String(value)
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Summary */}
      <div className={`mt-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Mostrando {filteredData.length} de {config.data.length} registros
        {Object.keys(activeFilters).length > 0 && ' (filtrado)'}
      </div>
    </div>
  )
}
