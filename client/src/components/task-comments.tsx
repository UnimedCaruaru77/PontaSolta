import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskComment, User } from "@shared/schema";

interface TaskCommentsProps {
  taskId: string;
}

type CommentWithUser = TaskComment & { user: User };

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const { data: task } = useQuery<any>({
    queryKey: ["/api/tasks", taskId],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentContent: string) => {
      return apiRequest("POST", `/api/tasks/${taskId}/comments`, {
        content: commentContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      setContent("");
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar comentário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createCommentMutation.mutate(content);
    }
  };

  const comments: CommentWithUser[] = task?.comments || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="size-5 text-primary" />
        <h3 className="text-lg font-semibold">
          Comentários ({comments.length})
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          data-testid="textarea-comment"
          placeholder="Adicione um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] bg-muted/30 border-border focus:border-primary placeholder:text-muted-foreground"
          disabled={createCommentMutation.isPending}
        />
        <div className="flex justify-end">
          <Button
            data-testid="button-add-comment"
            type="submit"
            disabled={!content.trim() || createCommentMutation.isPending}
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold"
          >
            {createCommentMutation.isPending ? (
              "Enviando..."
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Comentar
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-3 mt-6">
        {comments.length === 0 ? (
          <Card className="p-6 bg-muted/15 border-border text-center">
            <MessageSquare className="size-8 mx-auto mb-2 text-primary/50" />
            <p className="text-muted-foreground text-sm">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card
              key={comment.id}
              data-testid={`comment-${comment.id}`}
              className="p-4 bg-muted/20 border-border hover:border-primary/40 transition-all"
            >
              <div className="flex gap-3">
                <Avatar className="size-10 border-2 border-primary/50">
                  <AvatarImage src={comment.user?.profileImageUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {comment.user?.firstName?.[0]}
                    {comment.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      data-testid={`comment-author-${comment.id}`}
                      className="font-semibold text-foreground"
                    >
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span
                      data-testid={`comment-time-${comment.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDistanceToNow(new Date(comment.createdAt || new Date()), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p
                    data-testid={`comment-content-${comment.id}`}
                    className="text-foreground/80 text-sm whitespace-pre-wrap"
                  >
                    {comment.content}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
