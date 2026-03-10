import {
  users,
  teams,
  teamMembers,
  boards,
  tasks,
  taskShares,
  taskDependencies,
  subtasks,
  taskComments,
  taskAuditLog,
  tags,
  taskTags,
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
  type Tag,
  type InsertTag,
  type SharedTeamWithAssignee,
  type TaskSummary,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, ne } from "drizzle-orm";
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
  getTeamsByUser(userId: string): Promise<TeamWithMembers[]>;
  getTeamIdsByUser(userId: string): Promise<string[]>;
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
    teamIds?: string[];
    boardId?: string;
    status?: string;
    requestingUserId?: string;
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

  // Task sharing operations
  getTaskShares(taskId: string): Promise<SharedTeamWithAssignee[]>;
  addTaskShare(taskId: string, teamId: string): Promise<void>;
  removeTaskShare(taskId: string, teamId: string): Promise<void>;
  setShareAssignee(taskId: string, teamId: string, assigneeId: string | null): Promise<void>;

  // Tag operations
  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  getTaskTags(taskId: string): Promise<Tag[]>;
  addTaskTag(taskId: string, tagId: string): Promise<void>;
  removeTaskTag(taskId: string, tagId: string): Promise<void>;

  // Dependency operations
  getTaskDependencies(taskId: string): Promise<TaskSummary[]>;
  getTaskDependents(taskId: string): Promise<TaskSummary[]>;
  addTaskDependency(taskId: string, dependsOnTaskId: string): Promise<void>;
  removeTaskDependency(taskId: string, dependsOnTaskId: string): Promise<void>;

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

  async getTeamIdsByUser(userId: string): Promise<string[]> {
    const rows = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    return rows.map(r => r.teamId);
  }

  async getTeamsByUser(userId: string): Promise<TeamWithMembers[]> {
    const teamIds = await this.getTeamIdsByUser(userId);
    if (teamIds.length === 0) return [];
    const userTeams = await db
      .select()
      .from(teams)
      .where(inArray(teams.id, teamIds))
      .orderBy(teams.name);
    return Promise.all(userTeams.map(t => this.enrichTeam(t)));
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
    teamIds?: string[];
    boardId?: string;
    status?: string;
    requestingUserId?: string;
  }): Promise<TaskWithDetails[]> {
    const assigneeAlias = alias(users, 'assignee');
    const creatorAlias = alias(users, 'creator');

    const conditions: any[] = [];
    if (filters?.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));
    if (filters?.creatorId) conditions.push(eq(tasks.creatorId, filters.creatorId));
    if (filters?.teamId) conditions.push(eq(tasks.teamId, filters.teamId));
    if (filters?.boardId) conditions.push(eq(tasks.boardId, filters.boardId));
    if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));

    // Restrição por lista de equipes (para membros): task da equipe OU assignee/creator é o próprio usuário
    if (filters?.teamIds && filters.teamIds.length > 0) {
      const uid = filters.requestingUserId;
      const teamFilter = inArray(tasks.teamId, filters.teamIds);
      if (uid) {
        conditions.push(
          or(teamFilter, eq(tasks.assigneeId, uid), eq(tasks.creatorId, uid))
        );
      } else {
        conditions.push(teamFilter);
      }
    } else if (filters?.teamIds && filters.teamIds.length === 0) {
      // Membro sem equipes: só vê tasks onde é assignee ou creator
      if (filters.requestingUserId) {
        conditions.push(
          or(eq(tasks.assigneeId, filters.requestingUserId), eq(tasks.creatorId, filters.requestingUserId))
        );
      } else {
        return [];
      }
    }

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
    if (results.length === 0) return [];

    const taskIds = results.map(r => r.task.id);

    // Batch: subtasks
    const allSubtasks = await db.select().from(subtasks).where(inArray(subtasks.taskId, taskIds));
    const subtasksByTask = new Map<string, any[]>();
    for (const s of allSubtasks) {
      if (!subtasksByTask.has(s.taskId)) subtasksByTask.set(s.taskId, []);
      subtasksByTask.get(s.taskId)!.push(s);
    }

    // Batch: comments
    const allComments = await db
      .select({ comment: taskComments, user: users })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(inArray(taskComments.taskId, taskIds))
      .orderBy(desc(taskComments.createdAt));
    const commentsByTask = new Map<string, any[]>();
    for (const c of allComments) {
      if (!commentsByTask.has(c.comment.taskId)) commentsByTask.set(c.comment.taskId, []);
      commentsByTask.get(c.comment.taskId)!.push({ ...c.comment, user: c.user });
    }

    // Batch: shared teams with assignees
    const sharesByTask = new Map<string, SharedTeamWithAssignee[]>();
    try {
      const assigneeAlias = alias(users, 'shareAssignee');
      const allShares = await db
        .select({ taskId: taskShares.taskId, team: teams, assignee: assigneeAlias })
        .from(taskShares)
        .leftJoin(teams, eq(taskShares.teamId, teams.id))
        .leftJoin(assigneeAlias, eq(taskShares.assigneeId, assigneeAlias.id))
        .where(inArray(taskShares.taskId, taskIds));
      for (const s of allShares) {
        if (s.team) {
          if (!sharesByTask.has(s.taskId)) sharesByTask.set(s.taskId, []);
          sharesByTask.get(s.taskId)!.push({ ...s.team, assignee: s.assignee });
        }
      }
    } catch (_) {}

    // Batch: tags
    const tagsByTask = new Map<string, Tag[]>();
    try {
      const allTagRows = await db
        .select({ taskId: taskTags.taskId, tag: tags })
        .from(taskTags)
        .innerJoin(tags, eq(taskTags.tagId, tags.id))
        .where(inArray(taskTags.taskId, taskIds));
      for (const r of allTagRows) {
        if (!tagsByTask.has(r.taskId)) tagsByTask.set(r.taskId, []);
        tagsByTask.get(r.taskId)!.push(r.tag);
      }
    } catch (_) {}

    // Batch: dependencies
    const depsByTask = new Map<string, TaskSummary[]>();
    const dependentsByTask = new Map<string, TaskSummary[]>();
    try {
      const depTaskAlias = alias(tasks, 'depTask');
      const depAssigneeAlias = alias(users, 'depAssignee');
      const depTeamAlias = alias(teams, 'depTeam');

      const allDeps = await db
        .select({
          taskId: taskDependencies.taskId,
          dep: depTaskAlias,
          assignee: depAssigneeAlias,
          team: depTeamAlias,
        })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.dependsOnTaskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(inArray(taskDependencies.taskId, taskIds));

      for (const d of allDeps) {
        if (!depsByTask.has(d.taskId)) depsByTask.set(d.taskId, []);
        depsByTask.get(d.taskId)!.push({
          id: d.dep.id,
          title: d.dep.title,
          status: d.dep.status,
          dueDate: d.dep.dueDate,
          ticketNumber: d.dep.ticketNumber,
          assignee: d.assignee,
          team: d.team,
        });
      }

      const allDependents = await db
        .select({
          dependsOnTaskId: taskDependencies.dependsOnTaskId,
          dep: depTaskAlias,
          assignee: depAssigneeAlias,
          team: depTeamAlias,
        })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.taskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(inArray(taskDependencies.dependsOnTaskId, taskIds));

      for (const d of allDependents) {
        if (!dependentsByTask.has(d.dependsOnTaskId)) dependentsByTask.set(d.dependsOnTaskId, []);
        dependentsByTask.get(d.dependsOnTaskId)!.push({
          id: d.dep.id,
          title: d.dep.title,
          status: d.dep.status,
          dueDate: d.dep.dueDate,
          ticketNumber: d.dep.ticketNumber,
          assignee: d.assignee,
          team: d.team,
        });
      }
    } catch (_) {}

    const tasksWithDetails: TaskWithDetails[] = results.map(result => {
      const deps = depsByTask.get(result.task.id) || [];
      const blockedBy = deps.some(d => d.status !== 'done');
      return {
        ...result.task,
        assignee: result.assignee,
        creator: result.creator,
        team: result.team,
        board: result.board,
        subtasks: subtasksByTask.get(result.task.id) || [],
        comments: commentsByTask.get(result.task.id) || [],
        sharedTeams: sharesByTask.get(result.task.id) || [],
        tags: tagsByTask.get(result.task.id) || [],
        dependencies: deps,
        dependents: dependentsByTask.get(result.task.id) || [],
        blockedBy,
      };
    });
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

    const sharedTeams = await this.getTaskShares(id);

    let taskTagList: Tag[] = [];
    try {
      const tagRows = await db
        .select({ tag: tags })
        .from(taskTags)
        .innerJoin(tags, eq(taskTags.tagId, tags.id))
        .where(eq(taskTags.taskId, id));
      taskTagList = tagRows.map(r => r.tag);
    } catch (_) {}

    const deps = await this.getTaskDependencies(id);
    const dependents = await this.getTaskDependents(id);
    const blockedBy = deps.some(d => d.status !== 'done');

    return {
      ...result.task,
      assignee: result.assignee,
      creator: result.creator!,
      team: result.team,
      board: result.board,
      subtasks: taskSubtasks,
      comments: commentsData.map((c: any) => ({ ...c.comment, user: c.user })),
      sharedTeams,
      tags: taskTagList,
      dependencies: deps,
      dependents,
      blockedBy,
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

  // ── Task Shares ─────────────────────────────────────────────
  async getTaskShares(taskId: string): Promise<SharedTeamWithAssignee[]> {
    try {
      const assigneeAlias = alias(users, 'shareAssignee');
      const rows = await db
        .select({ team: teams, assignee: assigneeAlias })
        .from(taskShares)
        .leftJoin(teams, eq(taskShares.teamId, teams.id))
        .leftJoin(assigneeAlias, eq(taskShares.assigneeId, assigneeAlias.id))
        .where(eq(taskShares.taskId, taskId));
      return rows
        .filter(r => r.team)
        .map(r => ({ ...r.team!, assignee: r.assignee }));
    } catch (e) {
      return [];
    }
  }

  async addTaskShare(taskId: string, teamId: string): Promise<void> {
    await db
      .insert(taskShares)
      .values({ taskId, teamId })
      .onConflictDoNothing();
  }

  async removeTaskShare(taskId: string, teamId: string): Promise<void> {
    await db
      .delete(taskShares)
      .where(and(eq(taskShares.taskId, taskId), eq(taskShares.teamId, teamId)));
  }

  async setShareAssignee(taskId: string, teamId: string, assigneeId: string | null): Promise<void> {
    await db
      .update(taskShares)
      .set({ assigneeId })
      .where(and(eq(taskShares.taskId, taskId), eq(taskShares.teamId, teamId)));
  }

  // ── Tags ────────────────────────────────────────────────────
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async getTaskTags(taskId: string): Promise<Tag[]> {
    const rows = await db
      .select({ tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId));
    return rows.map(r => r.tag);
  }

  async addTaskTag(taskId: string, tagId: string): Promise<void> {
    await db.insert(taskTags).values({ taskId, tagId }).onConflictDoNothing();
  }

  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    await db
      .delete(taskTags)
      .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
  }

  // ── Dependencies ────────────────────────────────────────────
  async getTaskDependencies(taskId: string): Promise<TaskSummary[]> {
    try {
      const depTaskAlias = alias(tasks, 'depTask');
      const depAssigneeAlias = alias(users, 'depAssignee');
      const depTeamAlias = alias(teams, 'depTeam');

      const rows = await db
        .select({
          dep: depTaskAlias,
          assignee: depAssigneeAlias,
          team: depTeamAlias,
        })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.dependsOnTaskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(eq(taskDependencies.taskId, taskId));

      return rows.map(r => ({
        id: r.dep.id,
        title: r.dep.title,
        status: r.dep.status,
        dueDate: r.dep.dueDate,
        ticketNumber: r.dep.ticketNumber,
        assignee: r.assignee,
        team: r.team,
      }));
    } catch (_) {
      return [];
    }
  }

  async getTaskDependents(taskId: string): Promise<TaskSummary[]> {
    try {
      const depTaskAlias = alias(tasks, 'depTask');
      const depAssigneeAlias = alias(users, 'depAssignee');
      const depTeamAlias = alias(teams, 'depTeam');

      const rows = await db
        .select({
          dep: depTaskAlias,
          assignee: depAssigneeAlias,
          team: depTeamAlias,
        })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.taskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(eq(taskDependencies.dependsOnTaskId, taskId));

      return rows.map(r => ({
        id: r.dep.id,
        title: r.dep.title,
        status: r.dep.status,
        dueDate: r.dep.dueDate,
        ticketNumber: r.dep.ticketNumber,
        assignee: r.assignee,
        team: r.team,
      }));
    } catch (_) {
      return [];
    }
  }

  async addTaskDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    if (taskId === dependsOnTaskId) throw new Error("Uma tarefa não pode depender de si mesma");
    // Cycle check: if dependsOnTaskId already depends on taskId (directly or indirectly), reject
    const reverseDeps = await this.getTaskDependencies(dependsOnTaskId);
    const wouldCreateCycle = reverseDeps.some(d => d.id === taskId);
    if (wouldCreateCycle) throw new Error("Isso criaria uma dependência circular");
    await db
      .insert(taskDependencies)
      .values({ taskId, dependsOnTaskId })
      .onConflictDoNothing();
  }

  async removeTaskDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await db
      .delete(taskDependencies)
      .where(and(
        eq(taskDependencies.taskId, taskId),
        eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
      ));
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
