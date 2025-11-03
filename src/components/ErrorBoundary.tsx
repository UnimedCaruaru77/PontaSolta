'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary capturou um erro:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log do erro para monitoramento
    if (typeof window !== 'undefined') {
      console.group('🔍 Detalhes do Erro Client-Side')
      console.error('Erro:', error.message)
      console.error('Stack:', error.stack)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      // Fallback padrão
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-accent-red" />
              </div>
              <h2 className="text-xl font-semibold text-dark-50 mb-2">
                Oops! Algo deu errado
              </h2>
              <p className="text-dark-400 text-sm">
                Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
              </p>
            </div>

            {/* Detalhes do erro (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-dark-700 border border-dark-600 rounded-lg text-left">
                <h3 className="text-sm font-medium text-accent-red mb-2">Detalhes do Erro:</h3>
                <pre className="text-xs text-dark-300 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.resetError}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary w-full"
              >
                Recarregar Página
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-700">
              <p className="text-xs text-dark-500">
                Se o problema persistir, entre em contato com o suporte técnico.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para capturar erros em componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error('🚨 Erro capturado pelo useErrorHandler:', error)
    
    // Em produção, você pode enviar o erro para um serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry, LogRocket, etc.
      // captureException(error)
    }
  }
}

// Componente de fallback customizado para erros específicos
export function CardErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 m-4">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-accent-red mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-dark-50 mb-2">
          Erro no Card
        </h3>
        <p className="text-dark-400 text-sm mb-4">
          Ocorreu um erro ao processar este card. Tente novamente.
        </p>
        <button
          onClick={resetError}
          className="btn-primary"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  )
}

export default ErrorBoundary