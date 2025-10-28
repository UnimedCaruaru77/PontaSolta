'use client'

import { forwardRef } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  error?: string
  hasError?: boolean
  required?: boolean
  hint?: string
  success?: boolean
  children: React.ReactNode
  className?: string
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, hasError, required, hint, success, children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-dark-200">
          {label}
          {required && <span className="text-accent-red ml-1">*</span>}
        </label>
        
        <div className="relative">
          {children}
          
          {/* Success Icon */}
          {success && !hasError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          )}
          
          {/* Error Icon */}
          {hasError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="w-4 h-4 text-accent-red" />
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {hasError && error && (
          <p className="text-sm text-accent-red flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </p>
        )}
        
        {/* Hint */}
        {hint && !hasError && (
          <p className="text-xs text-dark-400">{hint}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ hasError, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          input-field w-full
          ${hasError ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
          ${className}
        `}
        {...props}
      />
    )
  }
)

InputField.displayName = 'InputField'

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ hasError, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          input-field w-full resize-none
          ${hasError ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
          ${className}
        `}
        {...props}
      />
    )
  }
)

TextAreaField.displayName = 'TextAreaField'

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean
  children: React.ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ hasError, className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          input-field w-full
          ${hasError ? 'border-accent-red focus:border-accent-red focus:ring-accent-red' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    )
  }
)

SelectField.displayName = 'SelectField'

// Componente de campo de telefone com máscara
interface PhoneFieldProps extends Omit<InputFieldProps, 'onChange'> {
  onChange?: (value: string) => void
}

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '')
      
      // Aplicar máscara (XX) XXXXX-XXXX
      if (value.length <= 11) {
        if (value.length > 6) {
          value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
        } else if (value.length > 2) {
          value = `(${value.slice(0, 2)}) ${value.slice(2)}`
        } else if (value.length > 0) {
          value = `(${value}`
        }
      }
      
      if (onChange) {
        onChange(value)
      }
    }

    return (
      <InputField
        ref={ref}
        {...props}
        onChange={handleChange}
        placeholder="(XX) XXXXX-XXXX"
        maxLength={15}
      />
    )
  }
)

PhoneField.displayName = 'PhoneField'

// Componente de campo de moeda
interface CurrencyFieldProps extends Omit<InputFieldProps, 'onChange'> {
  onChange?: (value: number) => void
}

export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(
  ({ onChange, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let numericValue = e.target.value.replace(/\D/g, '')
      const number = parseInt(numericValue) / 100
      
      if (onChange && !isNaN(number)) {
        onChange(number)
      }
    }

    const formatCurrency = (num: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(num)
    }

    const displayValue = typeof value === 'number' ? formatCurrency(value) : ''

    return (
      <InputField
        ref={ref}
        {...props}
        value={displayValue}
        onChange={handleChange}
        placeholder="R$ 0,00"
      />
    )
  }
)

CurrencyField.displayName = 'CurrencyField'