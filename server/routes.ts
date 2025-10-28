import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTaskSchema, insertSubtaskSchema, insertTaskCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        // Fallback to claims if user not in database (acceptable for dev/testing)
        console.warn('[auth] User not found in database, using OIDC claims as fallback');
        const fallbackUser = {
          id: req.user.claims.sub,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
          role: 'member',
          teamId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return res.json(fallbackUser);
      }
      res.json(user);
    } catch (error) {
      // If DB fails completely, use OIDC claims (dev/testing fallback)
      console.error("Error fetching user from database:", error.message);
      console.warn('[auth] Database unavailable, using OIDC claims as fallback');
      const fallbackUser = {
        id: req.user.claims.sub,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        role: 'member',
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      res.json(fallbackUser);
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Tasks routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { assigneeId, creatorId, teamId, status } = req.query;
      
      const filters: any = {};
      if (assigneeId) filters.assigneeId = assigneeId;
      if (creatorId) filters.creatorId = creatorId;
      if (teamId) filters.teamId = teamId;
      if (status) filters.status = status;

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      const updateData = req.body;
      
      const task = await storage.updateTask(taskId, updateData);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Subtasks routes
  app.post('/api/tasks/:taskId/subtasks', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = req.params.taskId;
      const subtaskData = insertSubtaskSchema.parse({
        ...req.body,
        taskId,
      });
      
      const subtask = await storage.createSubtask(subtaskData);
      res.status(201).json(subtask);
    } catch (error) {
      console.error("Error creating subtask:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subtask data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subtask" });
    }
  });

  app.patch('/api/subtasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const subtaskId = req.params.id;
      const updateData = req.body;
      
      const subtask = await storage.updateSubtask(subtaskId, updateData);
      res.json(subtask);
    } catch (error) {
      console.error("Error updating subtask:", error);
      res.status(500).json({ message: "Failed to update subtask" });
    }
  });

  app.delete('/api/subtasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const subtaskId = req.params.id;
      await storage.deleteSubtask(subtaskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subtask:", error);
      res.status(500).json({ message: "Failed to delete subtask" });
    }
  });

  // Comments routes
  app.post('/api/tasks/:taskId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = req.params.taskId;
      const userId = req.user.claims.sub;
      const commentData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId,
        userId,
      });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Teams routes
  app.get('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const teamId = req.params.id;
      const members = await storage.getUsersByTeam(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
