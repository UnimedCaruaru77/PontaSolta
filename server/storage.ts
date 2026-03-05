import {
  users,
  teams,
  tasks,
  subtasks,
  taskComments,
  taskAuditLog,
  type User,
  type UpsertUser,
  type Task,
  type InsertTask,
  type TaskWithDetails,
  type Team,
  type InsertTeam,
  type Subtask,
  type InsertSubtask,
  type TaskComment,
  type InsertTaskComment,
  type TaskAuditLog,
  type InsertTaskAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByTeam(teamId: string): Promise<User[]>;
  
  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getTeams(): Promise<Team[]>;
  
  // Task operations
  getTasks(filters?: {
    assigneeId?: string;
    creatorId?: string;
    teamId?: string;
    status?: string;
  }): Promise<TaskWithDetails[]>;
  getTask(id: string): Promise<TaskWithDetails | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Subtask operations
  getSubtasks(taskId: string): Promise<Subtask[]>;
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  updateSubtask(id: string, subtask: Partial<InsertSubtask>): Promise<Subtask>;
  deleteSubtask(id: string): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertTaskComment): Promise<TaskComment>;
  
  // Audit log operations
  createAuditLog(auditLog: InsertTaskAuditLog): Promise<TaskAuditLog>;
  getTaskAuditLogs(taskId: string): Promise<(TaskAuditLog & { user: User })[]>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    totalTasks: number;
    criticalTasks: number;
    inProgressTasks: number;
    completedTasks: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByTeam(teamId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.teamId, teamId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Team operations
  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values(team)
      .returning();
    return newTeam;
  }

  async getTeams(): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .orderBy(teams.name);
  }

  // Task operations
  async getTasks(filters?: {
    assigneeId?: string;
    creatorId?: string;
    teamId?: string;
    status?: string;
  }): Promise<TaskWithDetails[]> {
    const assigneeAlias = alias(users, 'assignee');
    const creatorAlias = alias(users, 'creator');
    
    let query = db
      .select({
        task: tasks,
        assignee: assigneeAlias,
        creator: creatorAlias,
        team: teams,
      })
      .from(tasks)
      .leftJoin(assigneeAlias, eq(tasks.assigneeId, assigneeAlias.id))
      .leftJoin(creatorAlias, eq(tasks.creatorId, creatorAlias.id))
      .leftJoin(teams, eq(tasks.teamId, teams.id));

    const conditions = [];
    if (filters?.assigneeId) {
      conditions.push(eq(tasks.assigneeId, filters.assigneeId));
    }
    if (filters?.creatorId) {
      conditions.push(eq(tasks.creatorId, filters.creatorId));
    }
    if (filters?.teamId) {
      conditions.push(eq(tasks.teamId, filters.teamId));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(tasks.createdAt));

    // Get subtasks and comments for each task
    const tasksWithDetails: TaskWithDetails[] = [];
    for (const result of results) {
      const taskSubtasks = await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.taskId, result.task.id));

      const commentsData = await db
        .select({
          comment: taskComments,
          user: users,
        })
        .from(taskComments)
        .leftJoin(users, eq(taskComments.userId, users.id))
        .where(eq(taskComments.taskId, result.task.id))
        .orderBy(desc(taskComments.createdAt));

      tasksWithDetails.push({
        ...result.task,
        assignee: result.assignee,
        creator: result.creator,
        team: result.team,
        subtasks: taskSubtasks,
        comments: commentsData.map((c: any) => ({
          ...c.comment,
          user: c.user,
        })),
      });
    }

    return tasksWithDetails;
  }

  async getTask(id: string): Promise<TaskWithDetails | undefined> {
    const assigneeAlias = alias(users, 'assignee');
    const creatorAlias = alias(users, 'creator');
    
    const [result] = await db
      .select({
        task: tasks,
        assignee: assigneeAlias,
        creator: creatorAlias,
        team: teams,
      })
      .from(tasks)
      .leftJoin(assigneeAlias, eq(tasks.assigneeId, assigneeAlias.id))
      .leftJoin(creatorAlias, eq(tasks.creatorId, creatorAlias.id))
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .where(eq(tasks.id, id));

    if (!result) return undefined;

    const taskSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, id));

    const commentsData = await db
      .select({
        comment: taskComments,
        user: users,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, id))
      .orderBy(desc(taskComments.createdAt));

    return {
      ...result.task,
      assignee: result.assignee,
      creator: result.creator,
      team: result.team,
      subtasks: taskSubtasks,
      comments: commentsData.map((c: any) => ({
        ...c.comment,
        user: c.user,
      })),
    };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Subtask operations
  async getSubtasks(taskId: string): Promise<Subtask[]> {
    return await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, taskId));
  }

  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const [newSubtask] = await db
      .insert(subtasks)
      .values(subtask)
      .returning();
    return newSubtask;
  }

  async updateSubtask(id: string, subtask: Partial<InsertSubtask>): Promise<Subtask> {
    const [updatedSubtask] = await db
      .update(subtasks)
      .set(subtask)
      .where(eq(subtasks.id, id))
      .returning();
    return updatedSubtask;
  }

  async deleteSubtask(id: string): Promise<void> {
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }

  // Comment operations
  async createComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db
      .insert(taskComments)
      .values(comment)
      .returning();
    return newComment;
  }

  // Audit log operations
  async createAuditLog(auditLog: InsertTaskAuditLog): Promise<TaskAuditLog> {
    const [newAuditLog] = await db
      .insert(taskAuditLog)
      .values(auditLog)
      .returning();
    return newAuditLog;
  }

  async getTaskAuditLogs(taskId: string): Promise<(TaskAuditLog & { user: User })[]> {
    const logsData = await db
      .select({
        log: taskAuditLog,
        user: users,
      })
      .from(taskAuditLog)
      .leftJoin(users, eq(taskAuditLog.userId, users.id))
      .where(eq(taskAuditLog.taskId, taskId))
      .orderBy(desc(taskAuditLog.createdAt));

    return logsData.map(({ log, user }) => ({
      ...log,
      user: user!,
    }));
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    totalTasks: number;
    criticalTasks: number;
    inProgressTasks: number;
    completedTasks: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    let baseQuery = db.select({ count: sql<number>`count(*)` }).from(tasks);

    // Filter by user's team or assigned/created tasks
    const userCondition = user.teamId 
      ? eq(tasks.teamId, user.teamId)
      : or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId));

    const totalTasks = await baseQuery
      .where(userCondition)
      .then(res => res[0]?.count || 0);

    const criticalTasks = await baseQuery
      .where(
        and(
          userCondition,
          eq(tasks.urgency, "critical"),
          eq(tasks.importance, "high")
        )
      )
      .then(res => res[0]?.count || 0);

    const inProgressTasks = await baseQuery
      .where(
        and(
          userCondition,
          eq(tasks.status, "in_progress")
        )
      )
      .then(res => res[0]?.count || 0);

    const completedTasks = await baseQuery
      .where(
        and(
          userCondition,
          eq(tasks.status, "done")
        )
      )
      .then(res => res[0]?.count || 0);

    return {
      totalTasks,
      criticalTasks,
      inProgressTasks,
      completedTasks,
    };
  }
}

export const storage = new DatabaseStorage();
