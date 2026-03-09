import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { insertTaskSchema, insertSubtaskSchema, insertTaskCommentSchema, insertTeamSchema, insertBoardSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ── Users ────────────────────────────────────────────────────
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const allUsers = await storage.getUsers();
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ── Teams ────────────────────────────────────────────────────
  app.get('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const teamsList = await storage.getTeams();
      res.json(teamsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) return res.status(404).json({ message: "Team not found" });
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(data);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.patch('/api/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const team = await storage.updateTeam(req.params.id, req.body);
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTeam(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  app.get('/api/teams/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const members = await storage.getUsersByTeam(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post('/api/teams/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "userId is required" });
      await storage.addTeamMember(req.params.id, userId);
      res.status(201).json({ message: "Member added" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  app.delete('/api/teams/:id/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeTeamMember(req.params.id, req.params.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  app.get('/api/teams/:id/boards', isAuthenticated, async (req: any, res) => {
    try {
      const boardsList = await storage.getBoardsByTeam(req.params.id);
      res.json(boardsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  // ── Boards ────────────────────────────────────────────────────
  app.get('/api/boards', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.query;
      const boardsList = teamId
        ? await storage.getBoardsByTeam(teamId as string)
        : await storage.getBoards();
      res.json(boardsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.get('/api/boards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const board = await storage.getBoard(req.params.id);
      if (!board) return res.status(404).json({ message: "Board not found" });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch board" });
    }
  });

  app.post('/api/boards', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertBoardSchema.parse(req.body);
      const board = await storage.createBoard(data);
      res.status(201).json(board);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  app.patch('/api/boards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const board = await storage.updateBoard(req.params.id, req.body);
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to update board" });
    }
  });

  app.delete('/api/boards/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBoard(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  // ── Tasks ────────────────────────────────────────────────────
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { assigneeId, creatorId, teamId, boardId, status } = req.query;
      const filters: any = {};
      if (assigneeId) filters.assigneeId = assigneeId;
      if (creatorId) filters.creatorId = creatorId;
      if (teamId) filters.teamId = teamId;
      if (boardId) filters.boardId = boardId;
      if (status) filters.status = status;
      const tasksList = await storage.getTasks(filters);
      res.json(tasksList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskData = insertTaskSchema.parse({ ...req.body, creatorId: userId });
      const task = await storage.createTask(taskData);
      await storage.createAuditLog({
        taskId: task.id, userId, action: 'created',
        field: null, oldValue: null, newValue: JSON.stringify(task),
      });
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

      const task = await storage.updateTask(taskId, req.body);

      const auditLogs = [];
      for (const [field, newValue] of Object.entries(req.body)) {
        const oldValue = (oldTask as any)[field];
        if (oldValue !== newValue && field !== 'updatedAt') {
          auditLogs.push(storage.createAuditLog({
            taskId, userId, action: 'updated', field,
            oldValue: oldValue != null ? JSON.stringify(oldValue) : null,
            newValue: newValue != null ? JSON.stringify(newValue) : null,
          }));
        }
      }
      await Promise.all(auditLogs);
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // ── Subtasks ─────────────────────────────────────────────────
  app.post('/api/tasks/:taskId/subtasks', isAuthenticated, async (req: any, res) => {
    try {
      const subtaskData = insertSubtaskSchema.parse({ ...req.body, taskId: req.params.taskId });
      const subtask = await storage.createSubtask(subtaskData);
      res.status(201).json(subtask);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid subtask data", errors: error.errors });
      res.status(500).json({ message: "Failed to create subtask" });
    }
  });

  app.patch('/api/subtasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const subtask = await storage.updateSubtask(req.params.id, req.body);
      res.json(subtask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subtask" });
    }
  });

  app.delete('/api/subtasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteSubtask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subtask" });
    }
  });

  // ── Audit log ────────────────────────────────────────────────
  app.get('/api/tasks/:taskId/audit', isAuthenticated, async (req: any, res) => {
    try {
      const logs = await storage.getTaskAuditLogs(req.params.taskId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ── Comments ─────────────────────────────────────────────────
  app.post('/api/tasks/:taskId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const commentData = insertTaskCommentSchema.parse({
        ...req.body, taskId: req.params.taskId, userId: req.user.id,
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
