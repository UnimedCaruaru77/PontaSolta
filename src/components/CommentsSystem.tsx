'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, Edit, Trash2, Reply, MoreHorizontal } from 'lucide-react'
import { useToast } from './ToastContainer'
import { ButtonSpinner } from './LoadingSpinner'
import { useConfirmation, confirmDelete } from './ConfirmationModal'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt?: string
  parentId?: string
  replies?: Comment[]
  isEdited: boolean
}

interface CommentsSystemProps {
  entityId: string
  entityType: 'card' | 'project' | 'team'
  currentUserId: string
}

export default function CommentsSystem({ entityId, entityType, currentUserId }: CommentsSystemProps) {
  const { showSuccess, showError } = useToast()
  const { confirm, ConfirmationComponent } = useConfirmation()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Carregar comentários
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/${entityType}s/${entityId}/comments`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Erro ao carregar comentários:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [entityId, entityType])

  // Adicionar comentário
  const handleAddComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId,
          authorId: currentUserId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (parentId) {
          // Adicionar resposta
          setComments(prev => prev.map(comment => 
            comment.id === parentId 
              ? { ...comment, replies: [...(comment.replies || []), data.comment] }
              : comment
          ))
        } else {
          // Adicionar comentário principal
          setComments(prev => [data.comment, ...prev])
        }

        setNewComment('')
        setReplyingTo(null)
        showSuccess('Comentário adicionado!')
      } else {
        throw new Error('Erro ao adicionar comentário')
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      showError('Erro ao adicionar comentário')
    } finally {
      setSubmitting(false)
    }
  }

  // Editar comentário
  const handleEditComment = async (commentId: string, content: string) => {
    if (!content.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, ...data.comment, isEdited: true }
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId 
                  ? { ...reply, ...data.comment, isEdited: true }
                  : reply
              )
            }
          }
          return comment
        }))

        setEditingComment(null)
        setEditContent('')
        showSuccess('Comentário atualizado!')
      } else {
        throw new Error('Erro ao editar comentário')
      }
    } catch (error) {
      console.error('Erro ao editar comentário:', error)
      showError('Erro ao editar comentário')
    } finally {
      setSubmitting(false)
    }
  }

  // Excluir comentário
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(prev => prev.filter(comment => {
          if (comment.id === commentId) return false
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply => reply.id !== commentId)
          }
          return true
        }))

        showSuccess('Comentário excluído!')
      } else {
        throw new Error('Erro ao excluir comentário')
      }
    } catch (error) {
      console.error('Erro ao excluir comentário:', error)
      showError('Erro ao excluir comentário')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'há poucos minutos'
    if (diffInHours === 1) return 'há 1 hora'
    if (diffInHours < 24) return `há ${diffInHours} horas`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'há 1 dia'
    if (diffInDays < 7) return `há ${diffInDays} dias`
    
    return date.toLocaleDateString('pt-BR')
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isAuthor = comment.author.id === currentUserId
    const [showActions, setShowActions] = useState(false)

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-dark-600 pl-4' : ''}`}>
        <div className="bg-dark-700 rounded-lg p-4 hover:bg-dark-600 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {comment.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-dark-200">{comment.author.name}</p>
                <p className="text-xs text-dark-400">
                  {formatDate(comment.createdAt)}
                  {comment.isEdited && ' (editado)'}
                </p>
              </div>
            </div>
            
            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 hover:bg-dark-500 rounded text-dark-400 hover:text-dark-200"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 top-8 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        setEditingComment(comment.id)
                        setEditContent(comment.content)
                        setShowActions(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-dark-200 hover:bg-dark-700 flex items-center space-x-2"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowActions(false)
                        await confirm(confirmDelete('este comentário', () => handleDeleteComment(comment.id)))
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-accent-red hover:bg-dark-700 flex items-center space-x-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {editingComment === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field w-full h-20 resize-none"
                placeholder="Editar comentário..."
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditComment(comment.id, editContent)}
                  disabled={submitting || !editContent.trim()}
                  className="btn-primary text-sm px-3 py-1 disabled:opacity-50 flex items-center space-x-1"
                >
                  {submitting && <ButtonSpinner />}
                  <span>Salvar</span>
                </button>
                <button
                  onClick={() => {
                    setEditingComment(null)
                    setEditContent('')
                  }}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-dark-200 text-sm leading-relaxed mb-3">{comment.content}</p>
              
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs text-primary-500 hover:text-primary-400 flex items-center space-x-1"
                >
                  <Reply className="w-3 h-3" />
                  <span>Responder</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Formulário de resposta */}
        {replyingTo === comment.id && (
          <div className="mt-3 ml-8">
            <CommentForm
              placeholder="Escrever uma resposta..."
              onSubmit={(content) => handleAddComment(content, comment.id)}
              onCancel={() => setReplyingTo(null)}
              submitting={submitting}
            />
          </div>
        )}

        {/* Respostas */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    )
  }

  const CommentForm = ({ 
    placeholder = "Escrever um comentário...", 
    onSubmit, 
    onCancel,
    submitting: formSubmitting = false
  }: {
    placeholder?: string
    onSubmit: (content: string) => void
    onCancel?: () => void
    submitting?: boolean
  }) => {
    const [content, setContent] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (content.trim()) {
        onSubmit(content)
        setContent('')
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input-field w-full h-20 resize-none"
          placeholder={placeholder}
          disabled={formSubmitting}
        />
        <div className="flex items-center space-x-2">
          <button
            type="submit"
            disabled={formSubmitting || !content.trim()}
            className="btn-primary text-sm px-3 py-1 disabled:opacity-50 flex items-center space-x-1"
          >
            {formSubmitting && <ButtonSpinner />}
            <Send className="w-3 h-3" />
            <span>Enviar</span>
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-sm px-3 py-1"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-dark-400" />
          <h3 className="text-lg font-medium text-dark-200">Comentários</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-dark-600 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-dark-600 rounded w-20"></div>
                  <div className="h-2 bg-dark-600 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-dark-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-dark-600 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-dark-400" />
          <h3 className="text-lg font-medium text-dark-200">
            Comentários ({comments.length})
          </h3>
        </div>
      </div>

      {/* Formulário de novo comentário */}
      <CommentForm
        onSubmit={(content) => handleAddComment(content)}
        submitting={submitting}
      />

      {/* Lista de comentários */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">Nenhum comentário ainda</p>
            <p className="text-dark-500 text-sm">Seja o primeiro a comentar!</p>
          </div>
        )}
      </div>

      <ConfirmationComponent />
    </div>
  )
}