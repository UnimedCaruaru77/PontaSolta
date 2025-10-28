'use client'

import { useState, useCallback, useMemo } from 'react'

interface FilterOptions {
  dateRange: {
    startDate: string
    endDate: string
    preset: 'custom' | 'today' | 'week' | 'month' | 'quarter' | 'year'
  }
  status: string[]
  priority: string[]
  urgency: string[]
  teams: string[]
  assignees: string[]
  creators: string[]
  tags: string[]
  hasDeadline: boolean | null
  isOverdue: boolean | null
  isProject: boolean | null
}

interface UseFiltersProps<T> {
  data: T[]
  initialFilters?: Partial<FilterOptions>
}

export function useFilters<T extends Record<string, any>>({ 
  data, 
  initialFilters = {} 
}: UseFiltersProps<T>) {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      startDate: '',
      endDate: '',
      preset: 'month'
    },
    status: [],
    priority: [],
    urgency: [],
    teams: [],
    assignees: [],
    creators: [],
    tags: [],
    hasDeadline: null,
    isOverdue: null,
    isProject: null,
    ...initialFilters
  })

  const [searchTerm, setSearchTerm] = useState('')

  // Função para verificar se uma data está no range
  const isDateInRange = useCallback((date: string, startDate: string, endDate: string) => {
    if (!date || (!startDate && !endDate)) return true
    
    const itemDate = new Date(date)
    const start = startDate ? new Date(startDate) : new Date('1900-01-01')
    const end = endDate ? new Date(endDate) : new Date('2100-12-31')
    
    return itemDate >= start && itemDate <= end
  }, [])

  // Função para verificar se está vencido
  const isOverdue = useCallback((endDate: string) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }, [])

  // Aplicar filtros aos dados
  const filteredData = useMemo(() => {
    let result = [...data]

    // Filtro de busca por texto
    if (searchTerm) {
      result = result.filter(item => {
        const searchFields = ['title', 'description', 'name']
        return searchFields.some(field => 
          item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    // Filtro por período
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      result = result.filter(item => {
        const dateFields = ['created_at', 'createdAt', 'start_date', 'startDate', 'end_date', 'endDate']
        return dateFields.some(field => 
          item[field] && isDateInRange(item[field], filters.dateRange.startDate, filters.dateRange.endDate)
        )
      })
    }

    // Filtro por status
    if (filters.status.length > 0) {
      result = result.filter(item => 
        filters.status.includes(item.status) || 
        filters.status.includes(item.column_id) ||
        filters.status.includes(item.columnId)
      )
    }

    // Filtro por prioridade
    if (filters.priority.length > 0) {
      result = result.filter(item => 
        filters.priority.includes(item.priority)
      )
    }

    // Filtro por urgência
    if (filters.urgency.length > 0) {
      result = result.filter(item => 
        filters.urgency.includes(item.urgency)
      )
    }

    // Filtro por equipes
    if (filters.teams.length > 0) {
      result = result.filter(item => 
        filters.teams.includes(item.team) ||
        filters.teams.includes(item.team_id) ||
        filters.teams.includes(item.teamId) ||
        filters.teams.some(team => item.team?.toLowerCase().includes(team))
      )
    }

    // Filtro por responsáveis
    if (filters.assignees.length > 0) {
      result = result.filter(item => 
        filters.assignees.includes(item.assignee?.id) ||
        filters.assignees.includes(item.assignee_id) ||
        filters.assignees.includes(item.assigneeId)
      )
    }

    // Filtro por criadores
    if (filters.creators.length > 0) {
      result = result.filter(item => 
        filters.creators.includes(item.creator?.id) ||
        filters.creators.includes(item.creator_id) ||
        filters.creators.includes(item.creatorId) ||
        filters.creators.includes(item.owner?.id) ||
        filters.creators.includes(item.owner_id) ||
        filters.creators.includes(item.ownerId)
      )
    }

    // Filtro por prazo
    if (filters.hasDeadline !== null) {
      result = result.filter(item => {
        const hasDeadline = !!(item.end_date || item.endDate)
        return hasDeadline === filters.hasDeadline
      })
    }

    // Filtro por vencimento
    if (filters.isOverdue !== null) {
      result = result.filter(item => {
        const itemIsOverdue = isOverdue(item.end_date || item.endDate)
        return itemIsOverdue === filters.isOverdue
      })
    }

    // Filtro por tipo (projeto/tarefa)
    if (filters.isProject !== null) {
      result = result.filter(item => {
        const itemIsProject = !!(item.is_project || item.isProject)
        return itemIsProject === filters.isProject
      })
    }

    return result
  }, [data, filters, searchTerm, isDateInRange, isOverdue])

  // Função para aplicar filtros
  const applyFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
  }, [])

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: {
        startDate: '',
        endDate: '',
        preset: 'month'
      },
      status: [],
      priority: [],
      urgency: [],
      teams: [],
      assignees: [],
      creators: [],
      tags: [],
      hasDeadline: null,
      isOverdue: null,
      isProject: null
    })
    setSearchTerm('')
  }, [])

  // Função para contar filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.urgency.length > 0) count++
    if (filters.teams.length > 0) count++
    if (filters.assignees.length > 0) count++
    if (filters.creators.length > 0) count++
    if (filters.hasDeadline !== null) count++
    if (filters.isOverdue !== null) count++
    if (filters.isProject !== null) count++
    if (searchTerm) count++
    return count
  }, [filters, searchTerm])

  // Função para verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return getActiveFiltersCount() > 0
  }, [getActiveFiltersCount])

  return {
    // Estados
    filters,
    searchTerm,
    filteredData,
    
    // Ações
    setFilters,
    setSearchTerm,
    applyFilters,
    clearFilters,
    
    // Utilitários
    getActiveFiltersCount,
    hasActiveFilters,
    
    // Estatísticas
    totalItems: data.length,
    filteredItems: filteredData.length,
    filterRatio: data.length > 0 ? (filteredData.length / data.length) * 100 : 0
  }
}