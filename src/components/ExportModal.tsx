'use client'

import { useState } from 'react'
import { X, Download, FileText, FileSpreadsheet, File, Calendar, Filter } from 'lucide-react'
import { useToast } from './ToastContainer'
import { ButtonSpinner } from './LoadingSpinner'

export type ExportFormat = 'pdf' | 'excel' | 'csv'
export type ExportType = 'projects' | 'cards' | 'teams' | 'reports' | 'dashboard'

interface ExportOptions {
  format: ExportFormat
  type: ExportType
  dateRange?: {
    start: string
    end: string
  }
  includeFilters?: boolean
  includeCharts?: boolean
  includeDetails?: boolean
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  defaultType?: ExportType
  currentFilters?: any
}

export default function ExportModal({ 
  isOpen, 
  onClose, 
  defaultType = 'reports',
  currentFilters 
}: ExportModalProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    type: defaultType,
    includeFilters: true,
    includeCharts: true,
    includeDetails: true
  })

  if (!isOpen) return null

  const formats = [
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Documento formatado para impressão' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Planilha para análise de dados' },
    { value: 'csv', label: 'CSV', icon: File, description: 'Dados tabulares simples' }
  ]

  const types = [
    { value: 'reports', label: 'Relatórios', description: 'Estatísticas e métricas gerais' },
    { value: 'projects', label: 'Projetos', description: 'Lista de projetos e status' },
    { value: 'cards', label: 'Cards/Tarefas', description: 'Todas as tarefas do sistema' },
    { value: 'teams', label: 'Equipes', description: 'Informações das equipes' },
    { value: 'dashboard', label: 'Dashboard', description: 'Visão geral do sistema' }
  ]

  const handleExport = async () => {
    setLoading(true)
    
    try {
      const exportData = {
        ...options,
        filters: options.includeFilters ? currentFilters : undefined,
        timestamp: new Date().toISOString()
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar exportação')
      }

      // Se for PDF ou Excel, fazer download do arquivo
      if (options.format === 'pdf' || options.format === 'excel') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${options.type}_${new Date().toISOString().split('T')[0]}.${options.format === 'excel' ? 'xlsx' : options.format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Para CSV, obter os dados e fazer download
        const data = await response.json()
        const csvContent = data.csvContent
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${options.type}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      showSuccess('Exportação Concluída!', 'O arquivo foi baixado com sucesso')
      onClose()

    } catch (error) {
      console.error('Erro na exportação:', error)
      showError('Erro na Exportação', 'Ocorreu um erro ao gerar o arquivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getFormatIcon = (format: ExportFormat) => {
    const formatData = formats.find(f => f.value === format)
    return formatData?.icon || FileText
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-dark-50">Exportar Dados</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tipo de Exportação */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">
              Tipo de Dados
            </label>
            <div className="grid grid-cols-1 gap-2">
              {types.map(type => (
                <label
                  key={type.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    options.type === type.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={options.type === type.value}
                    onChange={(e) => setOptions(prev => ({ ...prev, type: e.target.value as ExportType }))}
                    className="w-4 h-4 text-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-dark-200">{type.label}</p>
                    <p className="text-xs text-dark-400">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">
              Formato do Arquivo
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formats.map(format => {
                const Icon = format.icon
                return (
                  <label
                    key={format.value}
                    className={`flex flex-col items-center space-y-2 p-4 rounded-lg border cursor-pointer transition-colors ${
                      options.format === format.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={options.format === format.value}
                      onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
                      className="sr-only"
                    />
                    <Icon className={`w-8 h-8 ${
                      options.format === format.value ? 'text-primary-500' : 'text-dark-400'
                    }`} />
                    <div className="text-center">
                      <p className="text-sm font-medium text-dark-200">{format.label}</p>
                      <p className="text-xs text-dark-400">{format.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">
              Período (opcional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dark-400 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={options.dateRange?.start || ''}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      start: e.target.value,
                      end: prev.dateRange?.end || ''
                    }
                  }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Data Final</label>
                <input
                  type="date"
                  value={options.dateRange?.end || ''}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      start: prev.dateRange?.start || '',
                      end: e.target.value
                    }
                  }))}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* Opções Adicionais */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">
              Opções Adicionais
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeFilters}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeFilters: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded"
                />
                <span className="text-sm text-dark-300">Incluir filtros aplicados</span>
              </label>

              {(options.format === 'pdf' && (options.type === 'reports' || options.type === 'dashboard')) && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includeCharts}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded"
                  />
                  <span className="text-sm text-dark-300">Incluir gráficos e visualizações</span>
                </label>
              )}

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeDetails}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeDetails: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded"
                />
                <span className="text-sm text-dark-300">Incluir detalhes completos</span>
              </label>
            </div>
          </div>

          {/* Resumo */}
          {currentFilters && options.includeFilters && (
            <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Filter className="w-4 h-4 text-primary-500" />
                <h4 className="text-sm font-medium text-dark-200">Filtros que serão aplicados</h4>
              </div>
              <p className="text-sm text-dark-400">
                Os filtros atualmente ativos serão incluídos na exportação
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-dark-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="btn-primary disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <ButtonSpinner />}
            <Download className="w-4 h-4" />
            <span>{loading ? 'Exportando...' : 'Exportar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}