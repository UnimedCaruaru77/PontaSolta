import {
  users,
  teams,
  teamMembers,
  boards,
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
  type Board,
  type InsertBoard,
  type Subtask,
  type InsertSubtask,
  type TaskComment,
  type InsertTaskComment,
  type TaskAuditLog,
  type InsertTaskAuditLog,
  type TeamWithMembers,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByTeam(teamId: string): Promise<User[]>;

  // Team operations
  getTeam(id: string): Promise<TeamWithMembers | undefined>;
  getTeams(): Promise<TeamWithMembers[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  addTeamMember(teamId: string, userId: string): Promise<void>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;

  // Board operations
  getBoards(): Promise<Board[]>;
  getBoardsByTeam(teamId: string): Promise<Board[]>;
  getBoard(id: string): Promise<Board | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board>;
  deleteBoard(id: string): Promise<void>;

  // Task operations
  getTasks(filters?: {
    assigneeId?: string;
    creatorId?: string;
    teamId?: string;
    boardId?: string;
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
  // ── Users ──────────────────────────────────────────────────
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName, users.lastName);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(userData as any).returning();
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  async getUsersByTeam(teamId: string): Promise<User[]> {
    const rows = await db
      .select({ user: users })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(users.firstName);
    return rows.map(r => r.user);
  }

  // ── Teams ──────────────────────────────────────────────────
  private async enrichTeam(team: Team): Promise<TeamWithMembers> {
    const memberRows = await db
      .select({ user: users })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, team.id))
      .orderBy(users.firstName);

    const boardRows = await db
      .select()
      .from(boards)
      .where(eq(boards.teamId, team.id))
      .orderBy(boards.name);

    return {
      ...team,
      members: memberRows.map(r => r.user),
      boards: boardRows,
    };
  }

  async getTeam(id: string): Promise<TeamWithMembers | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    if (!team) return undefined;
    return this.enrichTeam(team);
  }

  async getTeams(): Promise<TeamWithMembers[]> {
    const allTeams = await db.select().from(teams).orderBy(teams.name);
    return Promise.all(allTeams.map(t => this.enrichTeam(t)));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team> {
    const [updated] = await db
      .update(teams)
      .set(team)
      .where(eq(teams.id, id))
      .returning();
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  async addTeamMember(teamId: string, userId: string): Promise<void> {
    await db
      .insert(teamMembers)
      .values({ teamId, userId })
      .onConflictDoNothing();
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  // ── Boards ─────────────────────────────────────────────────
  async getBoards(): Promise<Board[]> {
    return await db.select().from(boards).orderBy(boards.name);
  }

  async getBoardsByTeam(teamId: string): Promise<Board[]> {
    return await db
      .select()
      .from(boards)
      .where(eq(boards.teamId, teamId))
      .orderBy(boards.name);
  }

  async getBoard(id: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    return board;
  }

  async createBoard(board: InsertBoard): Promise<Board> {
    const [newBoard] = await db.insert(boards).values(board).returning();
    return newBoard;
  }

  async updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board> {
    const [updated] = await db
      .update(boards)
      .set(board)
      .where(eq(boards.id, id))
      .returning();
    return updated;
  }

  async deleteBoard(id: string): Promise<void> {
    await db.delete(boards).where(eq(boards.id, id));
  }

  // ── Tasks ──────────────────────────────────────────────────
  async getTasks(filters?: {
    assigneeId?: string;
    creatorId?: string;
    teamId?: string;
    boardId?: string;
    status?: string;
  }): Promise<TaskWithDetails[]> {
    const assigneeAlias = alias(users, 'assignee');
    const creatorAlias = alias(users, 'creator');

    const conditions: any[] = [];
    if (filters?.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));
    if (filters?.creatorId) conditions.push(eq(tasks.creatorId, filters.creatorId));
    if (filters?.teamId) conditions.push(eq(tasks.teamId, filters.teamId));
    if (filters?.boardId) conditions.push(eq(tasks.boardId, filters.boardId));
    if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));

    const results = await db
      .select({
        task: tasks,
        assignee: assigneeAlias,
        creator: creatorAlias,
        team: teams,
        board: boards,
      })
      .from(tasks)
      .leftJoin(assigneeAlias, eq(tasks.assigneeId, assigneeAlias.id))
      .leftJoin(creatorAlias, eq(tasks.creatorId, creatorAlias.id))
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(boards, eq(tasks.boardId, boards.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasks.createdAt));

    return this.hydrateTaskDetails(results);
  }

  private async hydrateTaskDetails(results: any[]): Promise<TaskWithDetails[]> {
    const tasksWithDetails: TaskWithDetails[] = [];
    for (const result of results) {
      const taskSubtasks = await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.taskId, result.task.id));

      const commentsData = await db
        .select({ comment: taskComments, user: users })
        .from(taskComments)
        .leftJoin(users, eq(taskComments.userId, users.id))
        .where(eq(taskComments.taskId, result.task.id))
        .orderBy(desc(taskComments.createdAt));

      tasksWithDetails.push({
        ...result.task,
        assignee: result.assignee,
        creator: result.creator,
        team: result.team,
        board: result.board,
        subtasks: taskSubtasks,
        comments: commentsData.map((c: any) => ({ ...c.comment, user: c.user })),
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
        board: boards,
      })
      .from(tasks)
      .leftJoin(assigneeAlias, eq(tasks.assigneeId, assigneeAlias.id))
      .leftJoin(creatorAlias, eq(tasks.creatorId, creatorAlias.id))
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(boards, eq(tasks.boardId, boards.id))
      .where(eq(tasks.id, id));

    if (!result) return undefined;

    const taskSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, id));

    const commentsData = await db
      .select({ comment: taskComments, user: users })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, id))
      .orderBy(desc(taskComments.createdAt));

    return {
      ...result.task,
      assignee: result.assignee,
      creator: result.creator!,
      team: result.team,
      board: result.board,
      subtasks: taskSubtasks,
      comments: commentsData.map((c: any) => ({ ...c.comment, user: c.user })),
    };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
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

  // ── Subtasks ───────────────────────────────────────────────
  async getSubtasks(taskId: string): Promise<Subtask[]> {
    return await db.select().from(subtasks).where(eq(subtasks.taskId, taskId));
  }

  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const [newSubtask] = await db.insert(subtasks).values(subtask).returning();
    return newSubtask;
  }

  async updateSubtask(id: string, subtask: Partial<InsertSubtask>): Promise<Subtask> {
    const [updated] = await db
      .update(subtasks)
      .set(subtask)
      .where(eq(subtasks.id, id))
      .returning();
    return updated;
  }

  async deleteSubtask(id: string): Promise<void> {
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }

  // ── Comments ───────────────────────────────────────────────
  async createComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db.insert(taskComments).values(comment).returning();
    return newComment;
  }

  // ── Audit log ──────────────────────────────────────────────
  async createAuditLog(auditLog: InsertTaskAuditLog): Promise<TaskAuditLog> {
    const [newLog] = await db.insert(taskAuditLog).values(auditLog).returning();
    return newLog;
  }

  async getTaskAuditLogs(taskId: string): Promise<(TaskAuditLog & { user: User })[]> {
    const logsData = await db
      .select({ log: taskAuditLog, user: users })
      .from(taskAuditLog)
      .leftJoin(users, eq(taskAuditLog.userId, users.id))
      .where(eq(taskAuditLog.taskId, taskId))
      .orderBy(desc(taskAuditLog.createdAt));
    return logsData.map(({ log, user }) => ({ ...log, user: user! }));
  }

  // ── Dashboard stats ────────────────────────────────────────
  async getDashboardStats(userId: string): Promise<{
    totalTasks: number;
    criticalTasks: number;
    inProgressTasks: number;
    completedTasks: number;
  }> {
    const userCondition = or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId));

    const count = (condition: any) =>
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(condition)
        .then(res => Number(res[0]?.count || 0));

    const [totalTasks, criticalTasks, inProgressTasks, completedTasks] = await Promise.all([
      count(userCondition),
      count(and(userCondition, eq(tasks.urgency, "critical"), eq(tasks.importance, "high"))),
      count(and(userCondition, eq(tasks.status, "in_progress"))),
      count(and(userCondition, eq(tasks.status, "done"))),
    ]);

    return { totalTasks, criticalTasks, inProgressTasks, completedTasks };
  }
}

export const storage = new DatabaseStorage();
