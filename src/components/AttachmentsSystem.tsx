'use client'

import { useState, useRef } from 'react'
import { 
  Paperclip, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  File,
  Upload,
  X,
  Eye
} from 'lucide-react'
import { useToast } from './ToastContainer'

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
  uploadedBy: string
}

interface AttachmentsSystemProps {
  entityId: string
  entityType: 'card' | 'project' | 'team'
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  maxFileSize?: number // em MB
  allowedTypes?: string[]
  maxFiles?: number
}

export default function AttachmentsSystem({
  entityId,
  entityType,
  attachments,
  onAttachmentsChange,
  maxFileSize = 10,
  allowedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx'],
  maxFiles = 10
}: AttachmentsSystemProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showSuccess, showError } = useToast()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${maxFileSize}MB`
    }

    // Verificar tipo
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      return file.type.match(type.replace('*', '.*'))
    })

    if (!isAllowed) {
      return 'Tipo de arquivo não permitido'
    }

    return null
  }

  const uploadFile = async (file: File): Promise<Attachment | null> => {
    try {
      // Simular upload (em produção, usar serviço real como AWS S3, Cloudinary, etc.)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityId', entityId)
      formData.append('entityType', entityType)

      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simular resposta do servidor
      const attachment: Attachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Em produção, seria a URL real
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'user_1' // Em produção, pegar do contexto de auth
      }

      return attachment
    } catch (error) {
      console.error('Erro no upload:', error)
      return null
    }
  }

  const handleFileSelect = async (files: FileList) => {
    if (attachments.length + files.length > maxFiles) {
      showError('Limite Excedido', `Máximo ${maxFiles} arquivos permitidos`)
      return
    }

    setUploading(true)
    const newAttachments: Attachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)
      
      if (error) {
        showError('Arquivo Inválido', `${file.name}: ${error}`)
        continue
      }

      const attachment = await uploadFile(file)
      if (attachment) {
        newAttachments.push(attachment)
      } else {
        showError('Erro no Upload', `Falha ao enviar ${file.name}`)
      }
    }

    if (newAttachments.length > 0) {
      const updatedAttachments = [...attachments, ...newAttachments]
      onAttachmentsChange(updatedAttachments)
      showSuccess('Upload Concluído', `${newAttachments.length} arquivo(s) enviado(s)`)
    }

    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = (attachment: Attachment) => {
    // Em produção, fazer download real
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (attachmentId: string) => {
    try {
      // Em produção, fazer DELETE na API
      const updatedAttachments = attachments.filter(att => att.id !== attachmentId)
      onAttachmentsChange(updatedAttachments)
      showSuccess('Anexo Removido', 'Arquivo removido com sucesso')
    } catch (error) {
      showError('Erro', 'Falha ao remover arquivo')
    }
  }

  const handlePreview = (attachment: Attachment) => {
    // Em produção, abrir preview modal ou nova aba
    window.open(attachment.url, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Paperclip className="w-4 h-4 text-dark-400" />
          <span className="text-sm font-medium text-dark-200">
            Anexos ({attachments.length}/{maxFiles})
          </span>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || attachments.length >= maxFiles}
          className="btn-secondary btn-sm"
        >
          <Upload className="w-4 h-4 mr-1" />
          Anexar
        </button>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver 
            ? 'border-primary-500 bg-primary-500/5' 
            : 'border-dark-600 hover:border-dark-500'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <Upload className="w-8 h-8 text-dark-400 mx-auto mb-2" />
        <p className="text-sm text-dark-400 mb-1">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-dark-500">
          Máximo {maxFileSize}MB • {maxFiles} arquivos • {allowedTypes.join(', ')}
        </p>
        
        {uploading && (
          <div className="mt-3">
            <div className="w-full bg-dark-700 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full animate-pulse w-1/2"></div>
            </div>
            <p className="text-xs text-dark-400 mt-1">Enviando...</p>
          </div>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-dark-600"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-dark-400">
                  {getFileIcon(attachment.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-200 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-dark-500">
                    {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {attachment.type.startsWith('image/') && (
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-primary-500 transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-primary-500 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-accent-red transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && (
        <div className="text-center py-6">
          <Paperclip className="w-8 h-8 text-dark-500 mx-auto mb-2" />
          <p className="text-sm text-dark-500">Nenhum anexo adicionado</p>
        </div>
      )}
    </div>
  )
}

// Hook para gerenciar anexos
export function useAttachments(entityId: string, entityType: string) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)

  const loadAttachments = async () => {
    setLoading(true)
    try {
      // Em produção, fazer GET na API
      const response = await fetch(`/api/${entityType}s/${entityId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAttachments = async (newAttachments: Attachment[]) => {
    try {
      // Em produção, fazer PUT na API
      setAttachments(newAttachments)
    } catch (error) {
      console.error('Erro ao atualizar anexos:', error)
    }
  }

  return {
    attachments,
    loading,
    loadAttachments,
    updateAttachments,
    setAttachments
  }
}