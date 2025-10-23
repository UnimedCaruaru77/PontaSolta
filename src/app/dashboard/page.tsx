'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Calendar,
  Filter,
  Plus,
  FolderPlus,
  Kanban,
  FileText
} from 'lucide-react'

interface DashboardStats {
  totalCards: number
  inProgress: number
  overdue: number
  completed: number
  highPriority: number
  urgent: number
  recentActivity: Array<{
    id: string
    title: string
    status: string
    updated_at: string
    creator: { name: string }
  }>
  teamPerformance: Array<{
    name: string
    performance: number
    completedCards: number
    totalCards: number
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalCards: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
    highPriority: 0,
    urgent: 0,
    recentActivity: [],
    teamPerformance: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Funções de navegação
  const handleCreateCard = () => {
    router.push('/kanban')
  }

  const handleNewProject = () => {
    router.push('/projects')
  }

  const handleViewKanban = () => {
    router.push('/kanban')
  }

  const handleReports = () => {
    router.push('/reports')
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Erro ao carregar estatísticas')
        }
        const data = await response.json()
        setStats(data.stats)
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
        setError('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string
    value: number
    icon: any
    color: string
    trend?: string
  }) => (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-400 text-sm font-medium">{title}</p>
          {loading ? (
            <div className="animate-pulse bg-dark-600 h-8 w-16 rounded mt-2"></div>
          ) : (
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          )}
          {trend && (
            <p className="text-xs text-dark-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('500', '500/10')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-50">Dashboard</h1>
          <p className="text-dark-400 mt-1">
            Visão geral das demandas e projetos
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
          <button className="btn-primary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total de Cards"
          value={stats.totalCards}
          icon={BarChart3}
          color="text-primary-500"
          trend="+12% este mês"
        />
        <StatCard
          title="Em Andamento"
          value={stats.inProgress}
          icon={Clock}
          color="text-accent-orange"
          trend="8 ativas"
        />
        <StatCard
          title="Vencidas"
          value={stats.overdue}
          icon={AlertTriangle}
          color="text-accent-red"
          trend="Requer atenção"
        />
        <StatCard
          title="Concluídas"
          value={stats.completed}
          icon={CheckCircle}
          color="text-green-500"
          trend="+5 esta semana"
        />
        <StatCard
          title="Alta Prioridade"
          value={stats.highPriority}
          icon={TrendingUp}
          color="text-secondary-500"
          trend="2 urgentes"
        />
        <StatCard
          title="Urgentes"
          value={stats.urgent}
          icon={AlertTriangle}
          color="text-accent-yellow"
          trend="Ação imediata"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-dark-50">Atividade Recente</h2>
            <Calendar className="w-5 h-5 text-dark-400" />
          </div>
          
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-dark-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-dark-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-dark-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => {
                const getActivityIcon = (status: string) => {
                  switch (status) {
                    case 'DONE':
                      return { icon: CheckCircle, color: 'text-primary-500', bg: 'bg-primary-500/10' }
                    case 'IN_PROGRESS':
                      return { icon: Clock, color: 'text-accent-orange', bg: 'bg-accent-orange/10' }
                    default:
                      return { icon: AlertTriangle, color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' }
                  }
                }

                const getTimeAgo = (dateString: string) => {
                  const now = new Date()
                  const date = new Date(dateString)
                  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
                  
                  if (diffInHours < 1) return 'há poucos minutos'
                  if (diffInHours === 1) return 'há 1 hora'
                  if (diffInHours < 24) return `há ${diffInHours} horas`
                  
                  const diffInDays = Math.floor(diffInHours / 24)
                  if (diffInDays === 1) return 'há 1 dia'
                  return `há ${diffInDays} dias`
                }

                const { icon: Icon, color, bg } = getActivityIcon(activity.status)

                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-dark-700 transition-colors">
                    <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-dark-200 text-sm">{activity.title}</p>
                      <p className="text-dark-500 text-xs">
                        {getTimeAgo(activity.updated_at)} • {activity.creator.name}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-dark-400">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-dark-50">Performance das Equipes</h2>
            <Users className="w-5 h-5 text-dark-400" />
          </div>
          
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-dark-600 rounded w-1/3"></div>
                    <div className="h-4 bg-dark-600 rounded w-16"></div>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div className="bg-dark-600 h-2 rounded-full w-1/2"></div>
                  </div>
                </div>
              ))
            ) : stats.teamPerformance.length > 0 ? (
              stats.teamPerformance.map((team, index) => {
                const getPerformanceColor = (performance: number) => {
                  if (performance >= 80) return 'bg-primary-500'
                  if (performance >= 60) return 'bg-secondary-500'
                  if (performance >= 40) return 'bg-accent-yellow'
                  return 'bg-accent-red'
                }

                const getPerformanceTextColor = (performance: number) => {
                  if (performance >= 80) return 'text-primary-500'
                  if (performance >= 60) return 'text-secondary-500'
                  if (performance >= 40) return 'text-accent-yellow'
                  return 'text-accent-red'
                }

                return (
                  <div key={team.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dark-200 text-sm">{team.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getPerformanceTextColor(team.performance)}`}>
                          {team.performance}%
                        </span>
                        <span className="text-dark-500 text-xs">
                          ({team.completedCards}/{team.totalCards})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPerformanceColor(team.performance)}`}
                        style={{ width: `${team.performance}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-dark-400">Nenhuma equipe encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-dark-50 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={handleCreateCard}
            className="btn-primary justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Card
          </button>
          <button 
            onClick={handleNewProject}
            className="btn-secondary justify-center"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Novo Projeto
          </button>
          <button 
            onClick={handleViewKanban}
            className="btn-secondary justify-center"
          >
            <Kanban className="w-4 h-4 mr-2" />
            Ver Kanban
          </button>
          <button 
            onClick={handleReports}
            className="btn-secondary justify-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Relatórios
          </button>
        </div>
      </div>
    </div>
  )
}