'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar, 
  Filter,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Activity,
  MoreHorizontal
} from 'lucide-react'

interface ReportData {
  cardsByStatus: Array<{ name: string; value: number; color: string }>
  cardsByPriority: Array<{ name: string; value: number; color: string }>
  teamPerformance: Array<{ team: string; completed: number; total: number; percentage: number }>
  monthlyTrend: Array<{ month: string; created: number; completed: number }>
  overdueCards: number
  avgCompletionTime: number
  totalCards: number
  completionRate: number
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [selectedTeam, setSelectedTeam] = useState('all')

  // Dados mockados para demonstração
  useEffect(() => {
    setTimeout(() => {
      const mockData: ReportData = {
        cardsByStatus: [
          { name: 'Backlog', value: 15, color: '#64748b' },
          { name: 'Em Andamento', value: 8, color: '#22d3ee' },
          { name: 'Em Revisão', value: 5, color: '#8b5cf6' },
          { name: 'Concluído', value: 32, color: '#10b981' }
        ],
        cardsByPriority: [
          { name: 'Alta', value: 12, color: '#ef4444' },
          { name: 'Média', value: 28, color: '#fb923c' },
          { name: 'Baixa', value: 20, color: '#10b981' }
        ],
        teamPerformance: [
          { team: 'Service Desk Operadora', completed: 18, total: 25, percentage: 72 },
          { team: 'NTI Lideranças', completed: 12, total: 15, percentage: 80 },
          { team: 'Desenvolvimento', completed: 8, total: 12, percentage: 67 }
        ],
        monthlyTrend: [
          { month: 'Jul', created: 15, completed: 12 },
          { month: 'Ago', created: 22, completed: 18 },
          { month: 'Set', created: 28, completed: 25 },
          { month: 'Out', created: 35, completed: 30 }
        ],
        overdueCards: 7,
        avgCompletionTime: 4.2,
        totalCards: 60,
        completionRate: 78
      }
      setReportData(mockData)
      setLoading(false)
    }, 1000)
  }, [dateRange, selectedTeam])

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    subtitle,
    trend 
  }: { 
    title: string
    value: string | number
    icon: any
    color: string
    subtitle?: string
    trend?: { value: number; isPositive: boolean }
  }) => (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('500', '500/10')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend.isPositive ? 'text-green-500' : 'text-accent-red'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-dark-400 text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>
          {loading ? (
            <div className="animate-pulse bg-dark-600 h-8 w-16 rounded"></div>
          ) : (
            value
          )}
        </p>
        {subtitle && (
          <p className="text-dark-500 text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )

  const ChartCard = ({ 
    title, 
    children, 
    actions 
  }: { 
    title: string
    children: React.ReactNode
    actions?: React.ReactNode
  }) => (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-dark-50">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  )

  const ProgressBar = ({ 
    label, 
    value, 
    total, 
    color = 'bg-primary-500' 
  }: { 
    label: string
    value: number
    total: number
    color?: string
  }) => {
    const percentage = Math.round((value / total) * 100)
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-200">{label}</span>
          <span className="text-sm text-dark-400">{value}/{total} ({percentage}%)</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div 
            className={`${color} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Relatórios</h1>
          <p className="text-dark-400 mt-1">
            Análise de performance e métricas do sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button className="btn-primary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatório Personalizado
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-dark-800 border border-dark-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-dark-300">Período:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último ano</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-dark-300">Equipe:</span>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="input-field"
          >
            <option value="all">Todas as equipes</option>
            <option value="service-desk">Service Desk Operadora</option>
            <option value="nti">NTI Lideranças</option>
            <option value="dev">Desenvolvimento</option>
          </select>
        </div>

        <button className="btn-secondary ml-auto">
          <Filter className="w-4 h-4 mr-2" />
          Mais Filtros
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Cards"
          value={reportData?.totalCards || 0}
          icon={Activity}
          color="text-primary-500"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${reportData?.completionRate || 0}%`}
          icon={CheckCircle}
          color="text-green-500"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Cards Vencidos"
          value={reportData?.overdueCards || 0}
          icon={AlertTriangle}
          color="text-accent-red"
          trend={{ value: 8, isPositive: false }}
        />
        <StatCard
          title="Tempo Médio"
          value={`${reportData?.avgCompletionTime || 0} dias`}
          icon={Clock}
          color="text-secondary-500"
          subtitle="Para conclusão"
          trend={{ value: 3, isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cards by Status */}
        <ChartCard 
          title="Cards por Status"
          actions={
            <button className="text-dark-400 hover:text-dark-200">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          }
        >
          {loading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-dark-600 rounded w-20"></div>
                  <div className="h-4 bg-dark-600 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {reportData?.cardsByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-dark-200 text-sm">{item.name}</span>
                  </div>
                  <span className="text-dark-400 text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Cards by Priority */}
        <ChartCard 
          title="Cards por Prioridade"
          actions={
            <button className="text-dark-400 hover:text-dark-200">
              <PieChart className="w-4 h-4" />
            </button>
          }
        >
          {loading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-dark-600 rounded w-16"></div>
                  <div className="h-4 bg-dark-600 rounded w-8"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {reportData?.cardsByPriority.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-dark-200 text-sm">{item.name} Prioridade</span>
                  </div>
                  <span className="text-dark-400 text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Team Performance */}
      <ChartCard 
        title="Performance das Equipes"
        actions={
          <div className="flex items-center space-x-2">
            <button className="btn-secondary text-sm px-3 py-1">
              Ver Detalhes
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-dark-600 rounded w-32"></div>
                  <div className="h-4 bg-dark-600 rounded w-16"></div>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div className="bg-dark-600 h-2 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {reportData?.teamPerformance.map((team, index) => (
              <ProgressBar
                key={index}
                label={team.team}
                value={team.completed}
                total={team.total}
                color={
                  team.percentage >= 80 ? 'bg-green-500' :
                  team.percentage >= 60 ? 'bg-primary-500' :
                  'bg-accent-orange'
                }
              />
            ))}
          </div>
        )}
      </ChartCard>

      {/* Monthly Trend */}
      <ChartCard 
        title="Tendência Mensal"
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-dark-400">Criados</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-dark-400">Concluídos</span>
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="animate-pulse">
            <div className="h-48 bg-dark-600 rounded"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {reportData?.monthlyTrend.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <span className="text-dark-200 font-medium">{month.month}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-dark-300">{month.created} criados</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-dark-300">{month.completed} concluídos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  )
}