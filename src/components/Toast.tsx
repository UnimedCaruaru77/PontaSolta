'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose(id)
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-accent-red" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-accent-yellow" />
      case 'info':
        return <Info className="w-5 h-5 text-primary-500" />
    }
  }

  const getStyles = () => {
    const baseStyles = "border-l-4 bg-dark-800 border border-dark-700"
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-green-500`
      case 'error':
        return `${baseStyles} border-l-accent-red`
      case 'warning':
        return `${baseStyles} border-l-accent-yellow`
      case 'info':
        return `${baseStyles} border-l-primary-500`
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className={`${getStyles()} rounded-lg shadow-lg p-4`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-dark-50">{title}</h4>
            {message && (
              <p className="text-sm text-dark-300 mt-1">{message}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-dark-400 hover:text-dark-200" />
          </button>
        </div>
      </div>
    </div>
  )
}