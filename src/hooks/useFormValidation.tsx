'use client'

import { useState, useCallback, useMemo } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  email?: boolean
  phone?: boolean
  date?: boolean
  number?: boolean
  min?: number
  max?: number
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string
}

interface UseFormValidationProps {
  rules: ValidationRules
  initialValues?: Record<string, any>
}

export function useFormValidation({ rules, initialValues = {} }: UseFormValidationProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Validar um campo específico
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rule = rules[fieldName]
    if (!rule) return null

    // Required
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Este campo é obrigatório'
    }

    // Se não é obrigatório e está vazio, não validar outros critérios
    if (!value && !rule.required) return null

    const stringValue = String(value || '')

    // Email
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(stringValue)) {
        return 'Email inválido'
      }
    }

    // Phone
    if (rule.phone) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
      if (!phoneRegex.test(stringValue)) {
        return 'Telefone deve estar no formato (XX) XXXXX-XXXX'
      }
    }

    // Date
    if (rule.date) {
      const date = new Date(stringValue)
      if (isNaN(date.getTime())) {
        return 'Data inválida'
      }
    }

    // Number
    if (rule.number) {
      const num = Number(value)
      if (isNaN(num)) {
        return 'Deve ser um número válido'
      }
      
      if (rule.min !== undefined && num < rule.min) {
        return `Valor mínimo é ${rule.min}`
      }
      
      if (rule.max !== undefined && num > rule.max) {
        return `Valor máximo é ${rule.max}`
      }
    }

    // MinLength
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Mínimo de ${rule.minLength} caracteres`
    }

    // MaxLength
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `Máximo de ${rule.maxLength} caracteres`
    }

    // Pattern
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'Formato inválido'
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [rules])

  // Validar todos os campos
  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [rules, values, validateField])

  // Atualizar valor de um campo
  const setValue = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    // Validar em tempo real se o campo já foi tocado
    if (touched[fieldName]) {
      const error = validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }))
    }
  }, [touched, validateField])

  // Marcar campo como tocado
  const setFieldTouched = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    // Validar quando o campo perde o foco
    const error = validateField(fieldName, values[fieldName])
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }))
  }, [values, validateField])

  // Resetar formulário
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  // Verificar se há erros
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error && error.length > 0)
  }, [errors])

  // Verificar se o formulário é válido
  const isValid = useMemo(() => {
    return !hasErrors && Object.keys(touched).length > 0
  }, [hasErrors, touched])

  // Obter props para um campo
  const getFieldProps = useCallback((fieldName: string) => {
    return {
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(fieldName, e.target.value)
      },
      onBlur: () => setFieldTouched(fieldName),
      error: touched[fieldName] ? errors[fieldName] : undefined,
      hasError: touched[fieldName] && !!errors[fieldName]
    }
  }, [values, errors, touched, setValue, setFieldTouched])

  return {
    values,
    errors,
    touched,
    hasErrors,
    isValid,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    getFieldProps
  }
}

// Hook para validações específicas do domínio
export function useProjectValidation(initialValues = {}) {
  return useFormValidation({
    rules: {
      title: {
        required: true,
        minLength: 3,
        maxLength: 100
      },
      description: {
        required: true,
        minLength: 10,
        maxLength: 500
      },
      startDate: {
        required: true,
        date: true,
        custom: (value) => {
          if (value && new Date(value) < new Date()) {
            return 'Data de início não pode ser no passado'
          }
          return null
        }
      },
      endDate: {
        required: true,
        date: true,
        custom: (value) => {
          const startDate = initialValues.startDate || new Date()
          if (value && new Date(value) <= new Date(startDate)) {
            return 'Data de término deve ser posterior à data de início'
          }
          return null
        }
      },
      team: {
        required: true,
        minLength: 2
      },
      budget: {
        number: true,
        min: 0,
        max: 10000000
      }
    },
    initialValues
  })
}

export function useTeamValidation(initialValues = {}) {
  return useFormValidation({
    rules: {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        custom: (value) => {
          if (value && /^\d+$/.test(value)) {
            return 'Nome não pode conter apenas números'
          }
          return null
        }
      },
      description: {
        required: true,
        minLength: 10,
        maxLength: 200
      }
    },
    initialValues
  })
}

export function useUserValidation(initialValues = {}) {
  return useFormValidation({
    rules: {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/
      },
      email: {
        required: true,
        email: true
      },
      phone: {
        phone: true
      },
      sector: {
        required: true,
        minLength: 2
      },
      branch: {
        required: true,
        minLength: 2
      }
    },
    initialValues
  })
}

export function useCardValidation(initialValues = {}) {
  return useFormValidation({
    rules: {
      title: {
        required: true,
        minLength: 3,
        maxLength: 100
      },
      description: {
        maxLength: 1000
      },
      endDate: {
        date: true,
        custom: (value) => {
          if (value && new Date(value) < new Date()) {
            return 'Prazo não pode ser no passado'
          }
          return null
        }
      }
    },
    initialValues
  })
}