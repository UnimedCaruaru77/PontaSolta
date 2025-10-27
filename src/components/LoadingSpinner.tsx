'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export default function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-dark-600 border-t-primary-500',
            sizeClasses[size]
          )}
        />
        {text && (
          <p className="text-sm text-dark-400">{text}</p>
        )}
      </div>
    </div>
  )
}

// Componente para loading em botões
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4',
        className
      )}
    />
  )
}

// Componente para loading de página inteira
export function PageLoader({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-dark-900/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-dark-200">{text}</p>
      </div>
    </div>
  )
}