import { NextRequest, NextResponse } from 'next/server'

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  dateRange: {
    startDate: string
    endDate: string
  }
  includeFields: string[]
  filters: {
    status: string[]
    priority: string[]
    teams: string[]
  }
  groupBy: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ExportRequest {
  context: string
  options: ExportOptions
  data: any[]
  title: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { context, options, data, title } = body

    // Filtrar dados baseado no período
    let filteredData = data.filter(item => {
      if (!options.dateRange.startDate && !options.dateRange.endDate) return true
      
      const itemDate = new Date(item.created_at || item.createdAt || item.start_date || item.startDate)
      const startDate = options.dateRange.startDate ? new Date(options.dateRange.startDate) : new Date('1900-01-01')
      const endDate = options.dateRange.endDate ? new Date(options.dateRange.endDate) : new Date('2100-12-31')
      
      return itemDate >= startDate && itemDate <= endDate
    })

    // Ordenar dados
    filteredData.sort((a, b) => {
      const aValue = a[options.sortBy] || ''
      const bValue = b[options.sortBy] || ''
      
      if (options.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Processar dados baseado no formato
    switch (options.format) {
      case 'csv':
        return handleCSVExport(filteredData, options, title)
      case 'excel':
        return handleExcelExport(filteredData, options, title)
      case 'pdf':
        return handlePDFExport(filteredData, options, title)
      default:
        return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro na exportação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function handleCSVExport(data: any[], options: ExportOptions, title: string) {
  try {
    // Cabeçalhos
    const headers = options.includeFields.map(field => getFieldLabel(field)).join(',')
    
    // Dados
    const rows = data.map(item => {
      return options.includeFields.map(field => {
        let value = getFieldValue(item, field)
        
        // Escapar aspas e vírgulas no CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        
        return value || ''
      }).join(',')
    })

    const csvContent = [headers, ...rows].join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${title}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar CSV:', error)
    return NextResponse.json({ error: 'Erro ao gerar CSV' }, { status: 500 })
  }
}

function handleExcelExport(data: any[], options: ExportOptions, title: string) {
  try {
    // Para uma implementação completa, você usaria uma biblioteca como 'xlsx'
    // Por enquanto, vamos retornar um CSV com headers Excel-friendly
    
    const headers = options.includeFields.map(field => getFieldLabel(field)).join('\t')
    
    const rows = data.map(item => {
      return options.includeFields.map(field => {
        return getFieldValue(item, field) || ''
      }).join('\t')
    })

    const excelContent = [headers, ...rows].join('\n')
    
    return new NextResponse(excelContent, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${title}_${new Date().toISOString().split('T')[0]}.xls"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar Excel:', error)
    return NextResponse.json({ error: 'Erro ao gerar Excel' }, { status: 500 })
  }
}

function handlePDFExport(data: any[], options: ExportOptions, title: string) {
  try {
    // Para uma implementação completa, você usaria uma biblioteca como 'puppeteer' ou 'jspdf'
    // Por enquanto, vamos retornar um HTML que pode ser convertido para PDF
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          Gerado em: ${new Date().toLocaleString('pt-BR')}<br>
          Total de registros: ${data.length}<br>
          Período: ${options.dateRange.startDate || 'Início'} até ${options.dateRange.endDate || 'Fim'}
        </div>
        
        <table>
          <thead>
            <tr>
              ${options.includeFields.map(field => `<th>${getFieldLabel(field)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${options.includeFields.map(field => `<td>${getFieldValue(item, field) || '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${title}_${new Date().toISOString().split('T')[0]}.html"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    'title': 'Título',
    'description': 'Descrição',
    'status': 'Status',
    'priority': 'Prioridade',
    'urgency': 'Urgência',
    'created_at': 'Data de Criação',
    'updated_at': 'Última Atualização',
    'start_date': 'Data de Início',
    'end_date': 'Data de Término',
    'assignee': 'Responsável',
    'creator': 'Criador',
    'team': 'Equipe',
    'board': 'Board',
    'column': 'Coluna',
    'methodology': 'Metodologia',
    'progress': 'Progresso',
    'owner': 'Proprietário',
    'budget': 'Orçamento',
    'name': 'Nome',
    'member_count': 'Número de Membros',
    'parent_team': 'Equipe Pai'
  }
  
  return labels[field] || field
}

function getFieldValue(item: any, field: string): string {
  switch (field) {
    case 'assignee':
      return item.assignee?.name || item.assignee_name || ''
    case 'creator':
      return item.creator?.name || item.creator_name || ''
    case 'owner':
      return item.owner?.name || item.owner_name || ''
    case 'team':
      return item.team?.name || item.team_name || item.team || ''
    case 'board':
      return item.board?.name || item.board_name || ''
    case 'column':
      return item.column?.name || item.column_name || ''
    case 'created_at':
    case 'updated_at':
    case 'start_date':
    case 'end_date':
      const date = item[field]
      return date ? new Date(date).toLocaleDateString('pt-BR') : ''
    case 'priority':
      const priority = item[field]
      return priority === 'HIGH' ? 'Alta' : priority === 'MEDIUM' ? 'Média' : priority === 'LOW' ? 'Baixa' : priority || ''
    case 'urgency':
      const urgency = item[field]
      return urgency === 'URGENT' ? 'Urgente' : urgency === 'NOT_URGENT' ? 'Não Urgente' : urgency || ''
    case 'status':
      const status = item[field]
      const statusMap: Record<string, string> = {
        'BACKLOG': 'Backlog',
        'IN_PROGRESS': 'Em Andamento',
        'REVIEW': 'Em Revisão',
        'DONE': 'Concluído',
        'PLANNING': 'Planejamento',
        'COMPLETED': 'Concluído'
      }
      return statusMap[status] || status || ''
    case 'progress':
      const progress = item[field]
      return progress ? `${progress}%` : '0%'
    case 'budget':
      const budget = item[field]
      return budget ? `R$ ${Number(budget).toLocaleString('pt-BR')}` : ''
    default:
      return String(item[field] || '')
  }
}