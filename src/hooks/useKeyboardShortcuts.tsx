'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
  category: string
  disabled?: boolean
}

interface ShortcutCategory {
  name: string
  shortcuts: KeyboardShortcut[]
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([])
  const [showHelp, setShowHelp] = useState(false)

  // Ações globais
  const globalActions = {
    // Navegação
    goToDashboard: () => router.push('/dashboard'),
    goToKanban: () => router.push('/kanban'),
    goToProjects: () => router.push('/projects'),
    goToTeams: () => router.push('/teams'),
    goToReports: () => router.push('/reports'),
    goToMySpace: () => router.push('/my-space'),
    
    // Modais
    toggleHelp: () => setShowHelp(!showHelp),
    
    // Ações de busca
    focusSearch: () => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    },
    
    // Ações de formulário
    submitForm: () => {
      const submitButton = document.querySelector('button[type="submit"]:not(:disabled)') as HTMLButtonElement
      if (submitButton) {
        submitButton.click()
      }
    },
    
    // Ações de modal
    closeModal: () => {
      const closeButton = document.querySelector('[data-modal-close], button[aria-label*="fechar"], button[aria-label*="Fechar"]') as HTMLButtonElement
      if (closeButton) {
        closeButton.click()
      } else {
        // Tentar ESC
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      }
    },
    
    // Ações de lista
    selectAll: () => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(:disabled)')
      checkboxes.forEach((checkbox: any) => {
        if (!checkbox.checked) {
          checkbox.click()
        }
      })
    },
    
    // Refresh
    refreshPage: () => {
      window.location.reload()
    }
  }

  // Definir atalhos padrão
  const defaultShortcuts: KeyboardShortcut[] = [
    // Navegação
    {
      key: 'd',
      ctrlKey: true,
      description: 'Ir para Dashboard',
      action: globalActions.goToDashboard,
      category: 'Navegação'
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Ir para Kanban',
      action: globalActions.goToKanban,
      category: 'Navegação'
    },
    {
      key: 'p',
      ctrlKey: true,
      description: 'Ir para Projetos',
      action: globalActions.goToProjects,
      category: 'Navegação'
    },
    {
      key: 't',
      ctrlKey: true,
      description: 'Ir para Equipes',
      action: globalActions.goToTeams,
      category: 'Navegação'
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'Ir para Relatórios',
      action: globalActions.goToReports,
      category: 'Navegação'
    },
    {
      key: 'm',
      ctrlKey: true,
      description: 'Ir para Meu Espaço',
      action: globalActions.goToMySpace,
      category: 'Navegação'
    },
    
    // Busca e Filtros
    {
      key: 'f',
      ctrlKey: true,
      description: 'Focar na busca',
      action: globalActions.focusSearch,
      category: 'Busca'
    },
    {
      key: '/',
      description: 'Busca rápida',
      action: globalActions.focusSearch,
      category: 'Busca'
    },
    
    // Ações Gerais
    {
      key: '?',
      description: 'Mostrar/Ocultar ajuda de atalhos',
      action: globalActions.toggleHelp,
      category: 'Ajuda'
    },
    {
      key: 'Enter',
      ctrlKey: true,
      description: 'Submeter formulário',
      action: globalActions.submitForm,
      category: 'Formulários'
    },
    {
      key: 'Escape',
      description: 'Fechar modal/cancelar',
      action: globalActions.closeModal,
      category: 'Modais'
    },
    {
      key: 'a',
      ctrlKey: true,
      description: 'Selecionar todos',
      action: globalActions.selectAll,
      category: 'Seleção'
    },
    {
      key: 'F5',
      description: 'Atualizar página',
      action: globalActions.refreshPage,
      category: 'Sistema'
    }
  ]

  useEffect(() => {
    setShortcuts(defaultShortcuts)
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorar se estiver em input/textarea (exceto atalhos específicos)
    const target = event.target as HTMLElement
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
    
    // Atalhos que funcionam mesmo em campos de input
    const globalShortcuts = ['Escape', 'F5', '?']
    
    if (isInputField && !globalShortcuts.includes(event.key)) {
      // Permitir apenas alguns atalhos específicos em campos de input
      if (!(event.ctrlKey && ['Enter', 'a'].includes(event.key))) {
        return
      }
    }

    // Encontrar atalho correspondente
    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey &&
        !shortcut.disabled
      )
    })

    if (matchingShortcut) {
      event.preventDefault()
      event.stopPropagation()
      matchingShortcut.action()
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Adicionar atalho customizado
  const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => [...prev, shortcut])
  }, [])

  // Remover atalho
  const removeShortcut = useCallback((key: string, modifiers: any = {}) => {
    setShortcuts(prev => prev.filter(shortcut => 
      !(shortcut.key === key && 
        shortcut.ctrlKey === modifiers.ctrlKey &&
        shortcut.altKey === modifiers.altKey &&
        shortcut.shiftKey === modifiers.shiftKey &&
        shortcut.metaKey === modifiers.metaKey)
    ))
  }, [])

  // Desabilitar/habilitar atalho
  const toggleShortcut = useCallback((key: string, modifiers: any = {}) => {
    setShortcuts(prev => prev.map(shortcut => {
      if (shortcut.key === key && 
          shortcut.ctrlKey === modifiers.ctrlKey &&
          shortcut.altKey === modifiers.altKey &&
          shortcut.shiftKey === modifiers.shiftKey &&
          shortcut.metaKey === modifiers.metaKey) {
        return { ...shortcut, disabled: !shortcut.disabled }
      }
      return shortcut
    }))
  }, [])

  // Agrupar atalhos por categoria
  const getShortcutsByCategory = useCallback((): ShortcutCategory[] => {
    const categories: { [key: string]: KeyboardShortcut[] } = {}
    
    shortcuts.forEach(shortcut => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = []
      }
      categories[shortcut.category].push(shortcut)
    })

    return Object.entries(categories).map(([name, shortcuts]) => ({
      name,
      shortcuts: shortcuts.sort((a, b) => a.description.localeCompare(b.description))
    }))
  }, [shortcuts])

  // Formatar atalho para exibição
  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = []
    
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.shiftKey) parts.push('Shift')
    if (shortcut.metaKey) parts.push('Cmd')
    
    // Formatação especial para algumas teclas
    let keyDisplay = shortcut.key
    switch (shortcut.key.toLowerCase()) {
      case 'enter': keyDisplay = '↵'; break
      case 'escape': keyDisplay = 'Esc'; break
      case 'arrowup': keyDisplay = '↑'; break
      case 'arrowdown': keyDisplay = '↓'; break
      case 'arrowleft': keyDisplay = '←'; break
      case 'arrowright': keyDisplay = '→'; break
      case ' ': keyDisplay = 'Space'; break
    }
    
    parts.push(keyDisplay.toUpperCase())
    
    return parts.join(' + ')
  }, [])

  return {
    shortcuts,
    showHelp,
    setShowHelp,
    addShortcut,
    removeShortcut,
    toggleShortcut,
    getShortcutsByCategory,
    formatShortcut,
    globalActions
  }
}

// Hook para atalhos específicos de página
export function usePageShortcuts(pageShortcuts: KeyboardShortcut[]) {
  const { addShortcut, removeShortcut } = useKeyboardShortcuts()

  useEffect(() => {
    // Adicionar atalhos da página
    pageShortcuts.forEach(shortcut => {
      addShortcut(shortcut)
    })

    // Cleanup: remover atalhos da página
    return () => {
      pageShortcuts.forEach(shortcut => {
        removeShortcut(shortcut.key, {
          ctrlKey: shortcut.ctrlKey,
          altKey: shortcut.altKey,
          shiftKey: shortcut.shiftKey,
          metaKey: shortcut.metaKey
        })
      })
    }
  }, [pageShortcuts, addShortcut, removeShortcut])
}

// Componente de ajuda de atalhos
export function KeyboardShortcutsHelp() {
  const { showHelp, setShowHelp, getShortcutsByCategory, formatShortcut } = useKeyboardShortcuts()

  if (!showHelp) return null

  const categories = getShortcutsByCategory()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-dark-50">Atalhos de Teclado</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-dark-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.name}>
                <h3 className="text-sm font-medium text-primary-400 mb-3 uppercase tracking-wide">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-dark-200 text-sm">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {formatShortcut(shortcut).split(' + ').map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="px-2 py-1 bg-dark-700 border border-dark-600 rounded text-xs text-dark-300 font-mono">
                              {key}
                            </kbd>
                            {keyIndex < formatShortcut(shortcut).split(' + ').length - 1 && (
                              <span className="text-dark-500 mx-1">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 bg-dark-750">
          <p className="text-xs text-dark-500 text-center">
            Pressione <kbd className="px-1 py-0.5 bg-dark-700 border border-dark-600 rounded text-dark-300">?</kbd> para mostrar/ocultar esta ajuda
          </p>
        </div>
      </div>
    </div>
  )
}