import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCardPriorityClass(priority: string, urgency: string, highImpact: boolean) {
  // Hierarquia: Vermelho (Alta+Urgente) > Amarelo (Alto impacto) > Preto (Alta) > Laranja (Urgente)
  if (priority === 'HIGH' && urgency === 'URGENT') {
    return 'card-priority-high-urgent'
  }
  if (highImpact) {
    return 'card-high-impact'
  }
  if (priority === 'HIGH') {
    return 'card-priority-high'
  }
  if (urgency === 'URGENT') {
    return 'card-urgent'
  }
  return ''
}

export function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isOverdue(date: Date | string) {
  return new Date(date) < new Date()
}

export function extractUsernameFromEmail(email: string): string {
  // Remove tudo após @ e números no final
  const beforeAt = email.split('@')[0]
  return beforeAt.replace(/\d+$/, '')
}