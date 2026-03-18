import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import {
  insertTaskSchema, insertSubtaskSchema, insertTaskCommentSchema,
  insertTeamSchema, insertBoardSchema, insertUserSchema, insertTagSchema,
  insertTeamEventSchema, insertSkillDefinitionSchema, insertMemberEvaluationSchema,
  insertTaskTemplateSchema, insertNotificationSchema, insertOnboardingItemSchema,
} from "@shared/schema";
import { z } from "zod";

async function canAccessDashboard(req: any, teamId: string): Promise<boolean> {
  const user = req.user;
  if (user.role === 'admin' || user.role === 'manager') return true;
  const isLead = await storage.isTeamLead(teamId, user.id);
  if (isLead) return true;
  const settings = await storage.getTeamSettings(teamId);
  return settings.dashboardPublic === true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try { res.json(req.user); }
    catch (error: any) { res.status(500).json({ message: "Erro ao buscar usuário" }); }
  });

  app.get('/api/auth/logout', (req: any, res) => {
    req.logout((err: any) => {
      if (err) return res.status(500).json({ message: "Erro ao fazer logout" });
      req.session.destroy(() => {
        res.redirect('/');
      });
    });
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) { res.status(500).json({ message: "Failed to fetch dashboard stats" }); }
  });

  // Team dashboard stats (with access control)
  app.get('/api/teams/:id/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const allowed = await canAccessDashboard(req, req.params.id);
      if (!allowed) return res.status(403).json({ message: "Acesso negado ao dashboard desta equipe" });
      const stats = await storage.getTeamDashboardStats(req.params.id);
      res.json(stats);
    } catch (error) { res.status(500).json({ message: "Falha ao buscar stats da equipe" }); }
  });

  // ── Users ────────────────────────────────────────────────────
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getUsers()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch users" }); }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão para criar usuários" });
      const userData = insertUserSchema.partial().parse(req.body);
      if (!userData.email) return res.status(400).json({ message: "Email é obrigatório" });
      const existing = await storage.getUserByEmail(userData.email);
      if (existing) return res.status(409).json({ message: "Usuário com este email já existe" });
      const newUser = await storage.createUser({ ...userData, role: userData.role || 'member' });
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Falha ao criar usuário" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.id !== req.params.id) return res.status(403).json({ message: "Sem permissão para editar este usuário" });
      res.json(await storage.updateUser(req.params.id, req.body));
    } catch (error) { res.status(500).json({ message: "Falha ao atualizar usuário" }); }
  });

  // ── Teams ────────────────────────────────────────────────────
  app.get('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const isMember = req.user.role === 'member';
      const teamsList = isMember ? await storage.getTeamsByUser(req.user.id) : await storage.getTeams();
      res.json(teamsList);
    } catch (error) { res.status(500).json({ message: "Failed to fetch teams" }); }
  });

  app.get('/api/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) return res.status(404).json({ message: "Team not found" });
      res.json(team);
    } catch (error) { res.status(500).json({ message: "Failed to fetch team" }); }
  });

  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      const teamData = insertTeamSchema.parse(req.body);
      res.status(201).json(await storage.createTeam(teamData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.patch('/api/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      res.json(await storage.updateTeam(req.params.id, req.body));
    } catch (error) { res.status(500).json({ message: "Failed to update team" }); }
  });

  app.delete('/api/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ message: "Apenas admins podem excluir equipes" });
      await storage.deleteTeam(req.params.id);
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Failed to delete team" }); }
  });

  app.get('/api/teams/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const isMember = req.user.role === 'member';
      if (isMember) {
        const memberTeamIds = await storage.getTeamIdsByUser(req.user.id);
        if (!memberTeamIds.includes(req.params.id)) return res.json([]);
      }
      res.json(await storage.getUsersByTeam(req.params.id));
    } catch (error) { res.status(500).json({ message: "Failed to fetch team members" }); }
  });

  app.post('/api/teams/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "userId é obrigatório" });
      await storage.addTeamMember(req.params.id, userId);
      res.status(201).json({ message: "Membro adicionado" });
    } catch (error) { res.status(500).json({ message: "Failed to add team member" }); }
  });

  app.delete('/api/teams/:id/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      await storage.removeTeamMember(req.params.id, req.params.userId);
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Failed to remove team member" }); }
  });

  // Toggle isLead for a team member
  app.patch('/api/teams/:id/members/:userId/lead', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      const { isLead } = req.body;
      if (typeof isLead !== 'boolean') return res.status(400).json({ message: "isLead deve ser boolean" });
      await storage.setTeamLead(req.params.id, req.params.userId, isLead);
      res.json({ message: "Liderança atualizada" });
    } catch (error) { res.status(500).json({ message: "Falha ao atualizar liderança" }); }
  });

  app.get('/api/teams/:id/boards', isAuthenticated, async (req: any, res) => {
    try {
      const isMember = req.user.role === 'member';
      if (isMember) {
        const memberTeamIds = await storage.getTeamIdsByUser(req.user.id);
        if (!memberTeamIds.includes(req.params.id)) return res.json([]);
      }
      res.json(await storage.getBoardsByTeam(req.params.id));
    } catch (error) { res.status(500).json({ message: "Failed to fetch boards" }); }
  });

  // Team settings
  app.get('/api/teams/:id/settings', isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getTeamSettings(req.params.id));
    } catch (error) { res.status(500).json({ message: "Falha ao buscar configurações" }); }
  });

  app.patch('/api/teams/:id/settings', isAuthenticated, async (req: any, res) => {
    try {
      const isLead = await storage.isTeamLead(req.params.id, req.user.id);
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && !isLead) return res.status(403).json({ message: "Sem permissão" });
      res.json(await storage.upsertTeamSettings(req.params.id, req.body));
    } catch (error) { res.status(500).json({ message: "Falha ao salvar configurações" }); }
  });

  // ── Team Events (Calendar) ────────────────────────────────────
  app.get('/api/teams/:id/events', isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getTeamEvents(req.params.id));
    } catch (error) { res.status(500).json({ message: "Falha ao buscar eventos" }); }
  });

  app.post('/api/teams/:id/events', isAuthenticated, async (req: any, res) => {
    try {
      const isLead = await storage.isTeamLead(req.params.id, req.user.id);
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && !isLead) return res.status(403).json({ message: "Sem permissão para criar eventos" });
      const data = insertTeamEventSchema.parse({ ...req.body, teamId: req.params.id, createdBy: req.user.id });
      res.status(201).json(await storage.createTeamEvent(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Falha ao criar evento" });
    }
  });

  app.patch('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.updateTeamEvent(req.params.id, req.body));
    } catch (error) { res.status(500).json({ message: "Falha ao atualizar evento" }); }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTeamEvent(req.params.id);
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Falha ao excluir evento" }); }
  });

  // ── Boards ────────────────────────────────────────────────────
  app.get('/api/boards', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getBoards()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch boards" }); }
  });

  app.post('/api/boards', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      const boardData = insertBoardSchema.parse(req.body);
      res.status(201).json(await storage.createBoard(boardData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  app.patch('/api/boards/:id', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.updateBoard(req.params.id, req.body)); }
    catch (error) { res.status(500).json({ message: "Failed to update board" }); }
  });

  app.delete('/api/boards/:id', isAuthenticated, async (req: any, res) => {
    try { await storage.deleteBoard(req.params.id); res.status(204).send(); }
    catch (error) { res.status(500).json({ message: "Failed to delete board" }); }
  });

  // ── Tasks ────────────────────────────────────────────────────
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { assigneeId, creatorId, teamId, boardId, status } = req.query;
      const filters: any = {};
      if (assigneeId) filters.assigneeId = assigneeId;
      if (creatorId) filters.creatorId = creatorId;
      if (boardId) filters.boardId = boardId;
      if (status) filters.status = status;

      const isMember = req.user.role === 'member';
      if (isMember) {
        const memberTeamIds = await storage.getTeamIdsByUser(req.user.id);
        if (teamId) {
          if (!memberTeamIds.includes(teamId as string)) return res.json([]);
          filters.teamId = teamId;
        } else {
          filters.teamIds = memberTeamIds;
          filters.requestingUserId = req.user.id;
        }
      } else {
        if (teamId) filters.teamId = teamId;
      }

      res.json(await storage.getTasks(filters));
    } catch (error: any) {
      console.error("[tasks] GET error:", error?.message || error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) { res.status(500).json({ message: "Failed to fetch task" }); }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskData = insertTaskSchema.parse({ ...req.body, creatorId: userId });
      const task = await storage.createTask(taskData);
      await storage.createAuditLog({ taskId: task.id, userId, action: 'created', field: null, oldValue: null, newValue: JSON.stringify(task) });

      // Notify assignee
      if (task.assigneeId && task.assigneeId !== userId) {
        await storage.createNotification({
          userId: task.assigneeId,
          title: 'Nova tarefa atribuída',
          message: `Você foi designado para a tarefa "${task.title}"`,
          type: 'task',
          taskId: task.id,
        });
      }

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;
      const oldTask = await storage.getTask(taskId);
      if (!oldTask) return res.status(404).json({ message: "Task not found" });

      let parsed = insertTaskSchema.partial().parse(req.body);

      const isChangingDueDate = parsed.dueDate !== undefined;
      const currentDue = oldTask.dueDate ? new Date(oldTask.dueDate) : null;
      const now = new Date();
      const isOverdue = currentDue && currentDue < now && oldTask.status !== 'done';
      const isRenegotiatedAndOverdue = oldTask.status === 'renegotiated' && currentDue && currentDue < now;

      if (isChangingDueDate && (isOverdue || isRenegotiatedAndOverdue)) {
        parsed = { ...parsed, status: 'renegotiated' as any, renegotiationCount: (oldTask.renegotiationCount || 0) + 1, lastRenegotiatedAt: now };
      }

      const task = await storage.updateTask(taskId, parsed as any);

      const auditLogs = [];
      if (isChangingDueDate && (isOverdue || isRenegotiatedAndOverdue)) {
        auditLogs.push(storage.createAuditLog({ taskId, userId, action: 'renegotiated', field: 'dueDate', oldValue: currentDue ? currentDue.toISOString() : null, newValue: parsed.dueDate ? (parsed.dueDate as Date).toISOString() : null }));
      } else {
        for (const [field, newValue] of Object.entries(req.body)) {
          const oldValue = (oldTask as any)[field];
          if (oldValue !== newValue && field !== 'updatedAt') {
            auditLogs.push(storage.createAuditLog({ taskId, userId, action: 'updated', field, oldValue: oldValue != null ? JSON.stringify(oldValue) : null, newValue: newValue != null ? JSON.stringify(newValue) : null }));
          }
        }
      }

      // Notify if assignee changed
      if (parsed.assigneeId && parsed.assigneeId !== oldTask.assigneeId && parsed.assigneeId !== userId) {
        await storage.createNotification({
          userId: parsed.assigneeId,
          title: 'Tarefa atribuída a você',
          message: `Você foi designado para a tarefa "${task.title}"`,
          type: 'task',
          taskId: task.id,
        });
      }

      await Promise.all(auditLogs);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try { await storage.deleteTask(req.params.id); res.status(204).send(); }
    catch (error) { res.status(500).json({ message: "Failed to delete task" }); }
  });

  // ── Task Shares ───────────────────────────────────────────────
  app.get('/api/tasks/:id/shares', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getTaskShares(req.params.id)); }
    catch (error) { res.status(500).json({ message: "Failed to fetch task shares" }); }
  });

  app.post('/api/tasks/:id/shares', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.body;
      if (!teamId) return res.status(400).json({ message: "teamId é obrigatório" });
      await storage.addTaskShare(req.params.id, teamId);
      res.status(201).json({ message: "Equipe adicionada ao compartilhamento" });
    } catch (error) { res.status(500).json({ message: "Failed to share task" }); }
  });

  app.patch('/api/tasks/:id/shares/:teamId', isAuthenticated, async (req: any, res) => {
    try {
      const { assigneeId } = req.body;
      await storage.setShareAssignee(req.params.id, req.params.teamId, assigneeId ?? null);
      res.json({ message: "Responsável da equipe atualizado" });
    } catch (error) { res.status(500).json({ message: "Failed to update share assignee" }); }
  });

  app.delete('/api/tasks/:id/shares/:teamId', isAuthenticated, async (req: any, res) => {
    try { await storage.removeTaskShare(req.params.id, req.params.teamId); res.status(204).send(); }
    catch (error) { res.status(500).json({ message: "Failed to remove task share" }); }
  });

  // ── Tags ─────────────────────────────────────────────────────
  app.get('/api/tags', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getTags()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch tags" }); }
  });

  app.post('/api/tags', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão para criar etiquetas" });
      const tagData = insertTagSchema.parse(req.body);
      res.status(201).json(await storage.createTag(tagData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.post('/api/tasks/:id/tags', isAuthenticated, async (req: any, res) => {
    try {
      const { tagId } = req.body;
      if (!tagId) return res.status(400).json({ message: "tagId é obrigatório" });
      await storage.addTaskTag(req.params.id, tagId);
      res.status(201).json({ ok: true });
    } catch (error) { res.status(500).json({ message: "Failed to add tag to task" }); }
  });

  app.delete('/api/tasks/:id/tags/:tagId', isAuthenticated, async (req: any, res) => {
    try { await storage.removeTaskTag(req.params.id, req.params.tagId); res.status(204).send(); }
    catch (error) { res.status(500).json({ message: "Failed to remove tag from task" }); }
  });

  // ── Dependencies ─────────────────────────────────────────────
  app.get('/api/tasks/:id/dependencies', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getTaskDependencies(req.params.id)); }
    catch (error) { res.status(500).json({ message: "Failed to fetch dependencies" }); }
  });

  app.post('/api/tasks/:id/dependencies', isAuthenticated, async (req: any, res) => {
    try {
      const { dependsOnTaskId } = req.body;
      if (!dependsOnTaskId) return res.status(400).json({ message: "dependsOnTaskId é obrigatório" });
      await storage.addTaskDependency(req.params.id, dependsOnTaskId);
      res.status(201).json({ ok: true });
    } catch (error: any) {
      if (error?.message?.includes("circular") || error?.message?.includes("si mesma")) return res.status(400).json({ message: error.message });
      res.status(500).json({ message: "Failed to add dependency" });
    }
  });

  app.delete('/api/tasks/:id/dependencies/:dependsOnTaskId', isAuthenticated, async (req: any, res) => {
    try { await storage.removeTaskDependency(req.params.id, req.params.dependsOnTaskId); res.status(204).send(); }
    catch (error) { res.status(500).json({ message: "Failed to remove dependency" }); }
  });

  // ── Subtasks ─────────────────────────────────────────────────
  app.post('/api/tasks/:taskId/subtasks', isAuthenticated, async (req: any, res) => {
    try {
      const subtaskData = insertSubtaskSchema.parse({ ...req.body, taskId: req.params.taskId });
      res.status(201).json(await storage.createSubtask(subtaskData));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid subtask data", errors: error.errors });
      res.status(500).json({ message: "Failed to create subtask" });
    }
  });

  app.patch('/api/subtasks/:id', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.updateSubtask(req.params.id, req.body)); }
    catch (error) { res.status(500).json({ message: "Failed to update subtask" }); }
  });

  app.delete('/api/subtasks/:id', isAuthenticated, async (req: any, res) => {
    try { await storage.deleteSubtask(req.params.id); res.status(204).send(); }
    catch (error) { res.status(500).json({ message: "Failed to delete subtask" }); }
  });

  // ── Audit log ────────────────────────────────────────────────
  app.get('/api/tasks/:taskId/audit', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getTaskAuditLogs(req.params.taskId)); }
    catch (error) { res.status(500).json({ message: "Failed to fetch audit logs" }); }
  });

  // ── Comments ─────────────────────────────────────────────────
  app.post('/api/tasks/:taskId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const commentData = insertTaskCommentSchema.parse({ ...req.body, taskId: req.params.taskId, userId: req.user.id });
      const comment = await storage.createComment(commentData);

      // Notify task assignee about comment
      const task = await storage.getTask(req.params.taskId);
      if (task && task.assigneeId && task.assigneeId !== req.user.id) {
        await storage.createNotification({
          userId: task.assigneeId,
          title: 'Novo comentário',
          message: `Comentário adicionado na tarefa "${task.title}"`,
          type: 'task',
          taskId: task.id,
        });
      }

      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // ── Skills ────────────────────────────────────────────────────
  app.get('/api/skills', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getSkillDefinitions()); }
    catch (error) { res.status(500).json({ message: "Falha ao buscar skills" }); }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      const data = insertSkillDefinitionSchema.parse(req.body);
      res.status(201).json(await storage.createSkillDefinition(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Falha ao criar skill" });
    }
  });

  app.delete('/api/skills/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      await storage.deleteSkillDefinition(req.params.id);
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Falha ao excluir skill" }); }
  });

  // ── Member Evaluations ────────────────────────────────────────
  app.get('/api/teams/:id/evaluations/:userId', isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getMemberEvaluations(req.params.id, req.params.userId));
    } catch (error) { res.status(500).json({ message: "Falha ao buscar avaliações" }); }
  });

  app.post('/api/teams/:id/evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const isLead = await storage.isTeamLead(req.params.id, req.user.id);
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && !isLead) return res.status(403).json({ message: "Apenas líderes podem avaliar membros" });
      const data = insertMemberEvaluationSchema.parse({ ...req.body, teamId: req.params.id, evaluatorId: req.user.id });
      res.status(201).json(await storage.upsertEvaluation(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Falha ao salvar avaliação" });
    }
  });

  // ── Task Templates ────────────────────────────────────────────
  app.get('/api/task-templates', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.query;
      res.json(await storage.getTaskTemplates(teamId as string | undefined));
    } catch (error) { res.status(500).json({ message: "Falha ao buscar templates" }); }
  });

  app.post('/api/task-templates', isAuthenticated, async (req: any, res) => {
    try {
      const isLead = req.body.teamId ? await storage.isTeamLead(req.body.teamId, req.user.id) : false;
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && !isLead) return res.status(403).json({ message: "Sem permissão" });
      const data = insertTaskTemplateSchema.parse({ ...req.body, createdBy: req.user.id });
      res.status(201).json(await storage.createTaskTemplate(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Falha ao criar template" });
    }
  });

  app.delete('/api/task-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({ message: "Sem permissão" });
      await storage.deleteTaskTemplate(req.params.id);
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Falha ao excluir template" }); }
  });

  // ── Notifications ─────────────────────────────────────────────
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getUserNotifications(req.user.id)); }
    catch (error) { res.status(500).json({ message: "Falha ao buscar notificações" }); }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const isLead = req.body.teamId ? await storage.isTeamLead(req.body.teamId, req.user.id) : false;
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && !isLead) {
        return res.status(403).json({ message: "Sem permissão para enviar notificações" });
      }
      const data = insertNotificationSchema.parse(req.body);
      const notif = await storage.createNotification(data);
      res.status(201).json(notif);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Falha ao criar notificação" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try { await storage.markNotificationRead(req.params.id); res.json({ ok: true }); }
    catch (error) { res.status(500).json({ message: "Falha ao marcar como lida" }); }
  });

  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try { await storage.markAllNotificationsRead(req.user.id); res.json({ ok: true }); }
    catch (error) { res.status(500).json({ message: "Falha ao marcar todas como lidas" }); }
  });

  // ── Onboarding ─────────────────────────────────────────────────
  app.get('/api/teams/:id/onboarding', isAuthenticated, async (req: any, res) => {
    try { res.json(await storage.getOnboardingProgress(req.params.id)); }
    catch (error) { res.status(500).json({ message: "Falha ao buscar onboarding" }); }
  });

  app.post('/api/teams/:id/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const isLead = await storage.isTeamLead(req.params.id, req.user.id);
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && !isLead) return res.status(403).json({ message: "Sem permissão" });
      const data = insertOnboardingItemSchema.parse({ ...req.body, teamId: req.params.id });
      res.status(201).json(await storage.createOnboardingItem(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      res.status(500).json({ message: "Falha ao criar item" });
    }
  });

  app.delete('/api/teams/:id/onboarding/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const isLead = await storage.isTeamLead(req.params.id, req.user.id);
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && !isLead) return res.status(403).json({ message: "Sem permissão" });
      await storage.deleteOnboardingItem(req.params.itemId);
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Falha ao excluir item" }); }
  });

  app.post('/api/teams/:id/onboarding/:itemId/toggle', isAuthenticated, async (req: any, res) => {
    try {
      await storage.toggleOnboardingProgress(req.params.itemId, req.user.id);
      res.json({ ok: true });
    } catch (error) { res.status(500).json({ message: "Falha ao atualizar progresso" }); }
  });

  const httpServer = createServer(app);
  return httpServer;
}
