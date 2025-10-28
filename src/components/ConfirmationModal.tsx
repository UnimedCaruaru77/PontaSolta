'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, X, Shield, Info } from 'lucide-react'
import { ButtonSpinner } from './LoadingSpinner'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  requiresTyping?: boolean
  confirmationText?: string
  icon?: React.ReactNode
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  requiresTyping = false,
  confirmationText = '',
  icon
}: ConfirmationModalProps) {
  const [loading, setLoading] = useState(false)
  const [typedText, setTypedText] = useState('')

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (requiresTyping && typedText !== confirmationText) {
      return
    }

    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Erro na confirmação:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setTypedText('')
      onClose()
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-accent-red/10',
          iconColor: 'text-accent-red',
          buttonClass: 'bg-accent-red hover:bg-accent-red/90 text-white',
          defaultIcon: <AlertTriangle className="w-6 h-6" />
        }
      case 'warning':
        return {
          iconBg: 'bg-accent-yellow/10',
          iconColor: 'text-accent-yellow',
          buttonClass: 'bg-accent-yellow hover:bg-accent-yellow/90 text-dark-900',
          defaultIcon: <Shield className="w-6 h-6" />
        }
      case 'info':
        return {
          iconBg: 'bg-primary-500/10',
          iconColor: 'text-primary-500',
          buttonClass: 'bg-primary-500 hover:bg-primary-600 text-white',
          defaultIcon: <Info className="w-6 h-6" />
        }
    }
  }

  const styles = getTypeStyles()
  const canConfirm = !requiresTyping || typedText === confirmationText

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              <div className={styles.iconColor}>
                {icon || styles.defaultIcon}
              </div>
            </div>
            <h2 className="text-lg font-semibold text-dark-50">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-dark-300 leading-relaxed">{message}</p>

          {requiresTyping && (
            <div className="space-y-2">
              <p className="text-sm text-dark-400">
                Para confirmar, digite <strong className="text-dark-200">"{confirmationText}"</strong> abaixo:
              </p>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="input-field w-full"
                placeholder={confirmationText}
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          {type === 'danger' && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-accent-red" />
                <p className="text-sm text-accent-red font-medium">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-dark-700">
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !canConfirm}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 
              flex items-center space-x-2 ${styles.buttonClass}
            `}
          >
            {loading && <ButtonSpinner />}
            <span>{loading ? 'Processando...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar confirmações
export function useConfirmation() {
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean
    props: Omit<ConfirmationModalProps, 'isOpen' | 'onClose'>
  }>({
    isOpen: false,
    props: {
      onConfirm: () => {},
      title: '',
      message: ''
    }
  })

  const confirm = (props: Omit<ConfirmationModalProps, 'isOpen' | 'onClose'>) => {
    return new Promise<boolean>((resolve) => {
      setConfirmation({
        isOpen: true,
        props: {
          ...props,
          onConfirm: async () => {
            try {
              await props.onConfirm()
              resolve(true)
            } catch (error) {
              resolve(false)
              throw error
            }
          }
        }
      })
    })
  }

  const close = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }))
  }

  const ConfirmationComponent = () => (
    <ConfirmationModal
      {...confirmation.props}
      isOpen={confirmation.isOpen}
      onClose={close}
    />
  )

  return {
    confirm,
    ConfirmationComponent
  }
}

// Funções de confirmação pré-configuradas
export const confirmDelete = (itemName: string, onConfirm: () => Promise<void> | void) => {
  return {
    title: 'Confirmar Exclusão',
    message: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
    confirmText: 'Excluir',
    type: 'danger' as const,
    icon: <Trash2 className="w-6 h-6" />,
    onConfirm
  }
}

export const confirmDeleteWithTyping = (itemName: string, onConfirm: () => Promise<void> | void) => {
  return {
    title: 'Confirmar Exclusão',
    message: `Você está prestes a excluir "${itemName}". Esta ação é irreversível e todos os dados relacionados serão perdidos permanentemente.`,
    confirmText: 'Excluir Permanentemente',
    type: 'danger' as const,
    requiresTyping: true,
    confirmationText: itemName,
    icon: <Trash2 className="w-6 h-6" />,
    onConfirm
  }
}

export const confirmAction = (
  title: string, 
  message: string, 
  onConfirm: () => Promise<void> | void,
  type: 'danger' | 'warning' | 'info' = 'warning'
) => {
  return {
    title,
    message,
    confirmText: 'Confirmar',
    type,
    onConfirm
  }
}