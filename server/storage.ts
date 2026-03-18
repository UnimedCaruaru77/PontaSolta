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
  teamEvents,
  skillDefinitions,
  memberEvaluations,
  teamSettings,
  taskTemplates,
  notifications,
  onboardingItems,
  onboardingProgress,
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
  type TeamEvent,
  type InsertTeamEvent,
  type SkillDefinition,
  type InsertSkillDefinition,
  type MemberEvaluation,
  type InsertMemberEvaluation,
  type MemberEvaluationWithSkill,
  type TeamSettings,
  type TaskTemplate,
  type InsertTaskTemplate,
  type Notification,
  type InsertNotification,
  type OnboardingItem,
  type InsertOnboardingItem,
  type OnboardingItemWithProgress,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, ne, asc } from "drizzle-orm";
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
  setTeamLead(teamId: string, userId: string, isLead: boolean): Promise<void>;
  isTeamLead(teamId: string, userId: string): Promise<boolean>;

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
  getDashboardStats(userId: string): Promise<{ totalTasks: number; criticalTasks: number; inProgressTasks: number; completedTasks: number }>;
  getTeamDashboardStats(teamId: string): Promise<{ byStatus: Record<string, number>; byPriority: Record<string, number>; byAssignee: { userId: string; name: string; count: number }[]; completionTrend: { date: string; count: number }[] }>;

  // Team events (calendar)
  getTeamEvents(teamId: string): Promise<TeamEvent[]>;
  createTeamEvent(data: InsertTeamEvent): Promise<TeamEvent>;
  updateTeamEvent(id: string, data: Partial<InsertTeamEvent>): Promise<TeamEvent>;
  deleteTeamEvent(id: string): Promise<void>;

  // Skills
  getSkillDefinitions(): Promise<SkillDefinition[]>;
  createSkillDefinition(data: InsertSkillDefinition): Promise<SkillDefinition>;
  deleteSkillDefinition(id: string): Promise<void>;

  // Member evaluations
  getMemberEvaluations(teamId: string, userId: string): Promise<MemberEvaluationWithSkill[]>;
  upsertEvaluation(data: InsertMemberEvaluation): Promise<MemberEvaluation>;

  // Team settings
  getTeamSettings(teamId: string): Promise<TeamSettings>;
  upsertTeamSettings(teamId: string, data: Partial<TeamSettings>): Promise<TeamSettings>;

  // Task templates
  getTaskTemplates(teamId?: string): Promise<TaskTemplate[]>;
  createTaskTemplate(data: InsertTaskTemplate): Promise<TaskTemplate>;
  deleteTaskTemplate(id: string): Promise<void>;

  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Onboarding
  getOnboardingItems(teamId: string): Promise<OnboardingItem[]>;
  createOnboardingItem(data: InsertOnboardingItem): Promise<OnboardingItem>;
  deleteOnboardingItem(id: string): Promise<void>;
  getOnboardingProgress(teamId: string): Promise<OnboardingItemWithProgress[]>;
  toggleOnboardingProgress(itemId: string, userId: string): Promise<void>;
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
      .onConflictDoUpdate({ target: users.id, set: { ...userData, updatedAt: new Date() } })
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
      .select({ user: users, isLead: teamMembers.isLead })
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
      members: memberRows.map(r => ({ ...r.user, isLead: r.isLead ?? false })),
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
    const userTeams = await db.select().from(teams).where(inArray(teams.id, teamIds)).orderBy(teams.name);
    return Promise.all(userTeams.map(t => this.enrichTeam(t)));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team> {
    const [updated] = await db.update(teams).set(team).where(eq(teams.id, id)).returning();
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  async addTeamMember(teamId: string, userId: string): Promise<void> {
    await db.insert(teamMembers).values({ teamId, userId }).onConflictDoNothing();
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async setTeamLead(teamId: string, userId: string, isLead: boolean): Promise<void> {
    await db
      .update(teamMembers)
      .set({ isLead })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async isTeamLead(teamId: string, userId: string): Promise<boolean> {
    const [row] = await db
      .select({ isLead: teamMembers.isLead })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return row?.isLead ?? false;
  }

  // ── Boards ─────────────────────────────────────────────────
  async getBoards(): Promise<Board[]> {
    return await db.select().from(boards).orderBy(boards.name);
  }

  async getBoardsByTeam(teamId: string): Promise<Board[]> {
    return await db.select().from(boards).where(eq(boards.teamId, teamId)).orderBy(boards.name);
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
    const [updated] = await db.update(boards).set(board).where(eq(boards.id, id)).returning();
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
    if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));

    // Pre-fetch IDs of tasks shared with the viewing team(s)
    let sharedTaskIds: string[] = [];
    if (filters?.teamId) {
      const rows = await db.select({ id: taskShares.taskId }).from(taskShares).where(eq(taskShares.teamId, filters.teamId));
      sharedTaskIds = rows.map(r => r.id);
    } else if (filters?.teamIds && filters.teamIds.length > 0) {
      const rows = await db.select({ id: taskShares.taskId }).from(taskShares).where(inArray(taskShares.teamId, filters.teamIds));
      sharedTaskIds = [...new Set(rows.map(r => r.id))];
    }

    if (filters?.teamId) {
      // Own team's tasks (filtered by boardId if given) OR shared tasks (always shown, boardId doesn't apply)
      const ownClauses: any[] = [eq(tasks.teamId, filters.teamId)];
      if (filters.boardId) ownClauses.push(eq(tasks.boardId, filters.boardId));
      const ownClause = ownClauses.length === 1 ? ownClauses[0] : and(...ownClauses);
      conditions.push(sharedTaskIds.length > 0 ? or(ownClause, inArray(tasks.id, sharedTaskIds)) : ownClause);
    } else {
      if (filters?.boardId) conditions.push(eq(tasks.boardId, filters.boardId));
      if (filters?.teamIds !== undefined) {
        if (filters.teamIds.length > 0) {
          const uid = filters.requestingUserId;
          const teamFilter = inArray(tasks.teamId, filters.teamIds);
          const orClauses: any[] = [teamFilter];
          if (uid) { orClauses.push(eq(tasks.assigneeId, uid)); orClauses.push(eq(tasks.creatorId, uid)); }
          if (sharedTaskIds.length > 0) orClauses.push(inArray(tasks.id, sharedTaskIds));
          conditions.push(or(...orClauses));
        } else {
          if (filters.requestingUserId) {
            conditions.push(or(eq(tasks.assigneeId, filters.requestingUserId), eq(tasks.creatorId, filters.requestingUserId)));
          } else {
            return [];
          }
        }
      }
    }

    const results = await db
      .select({ task: tasks, assignee: assigneeAlias, creator: creatorAlias, team: teams, board: boards })
      .from(tasks)
      .leftJoin(assigneeAlias, eq(tasks.assigneeId, assigneeAlias.id))
      .leftJoin(creatorAlias, eq(tasks.creatorId, creatorAlias.id))
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(boards, eq(tasks.boardId, boards.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasks.createdAt));

    const hydratedTasks = await this.hydrateTaskDetails(results);
    const sharedSet = new Set(sharedTaskIds);
    const viewingTeamId = filters?.teamId;
    const viewingTeamIds = filters?.teamIds;

    return hydratedTasks.map(t => ({
      ...t,
      isSharedWithCurrentTeam: viewingTeamId
        ? t.teamId !== viewingTeamId
        : viewingTeamIds?.length
          ? !viewingTeamIds.includes(t.teamId!) && sharedSet.has(t.id)
          : false,
    }));
  }

  private async hydrateTaskDetails(results: any[]): Promise<TaskWithDetails[]> {
    if (results.length === 0) return [];
    const taskIds = results.map(r => r.task.id);

    const allSubtasks = await db.select().from(subtasks).where(inArray(subtasks.taskId, taskIds));
    const subtasksByTask = new Map<string, any[]>();
    for (const s of allSubtasks) {
      if (!subtasksByTask.has(s.taskId)) subtasksByTask.set(s.taskId, []);
      subtasksByTask.get(s.taskId)!.push(s);
    }

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

    const depsByTask = new Map<string, TaskSummary[]>();
    const dependentsByTask = new Map<string, TaskSummary[]>();
    try {
      const depTaskAlias = alias(tasks, 'depTask');
      const depAssigneeAlias = alias(users, 'depAssignee');
      const depTeamAlias = alias(teams, 'depTeam');

      const allDeps = await db
        .select({ taskId: taskDependencies.taskId, dep: depTaskAlias, assignee: depAssigneeAlias, team: depTeamAlias })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.dependsOnTaskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(inArray(taskDependencies.taskId, taskIds));

      for (const d of allDeps) {
        if (!depsByTask.has(d.taskId)) depsByTask.set(d.taskId, []);
        depsByTask.get(d.taskId)!.push({ id: d.dep.id, title: d.dep.title, status: d.dep.status, dueDate: d.dep.dueDate, ticketNumber: d.dep.ticketNumber, assignee: d.assignee, team: d.team });
      }

      const allDependents = await db
        .select({ dependsOnTaskId: taskDependencies.dependsOnTaskId, dep: depTaskAlias, assignee: depAssigneeAlias, team: depTeamAlias })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.taskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(inArray(taskDependencies.dependsOnTaskId, taskIds));

      for (const d of allDependents) {
        if (!dependentsByTask.has(d.dependsOnTaskId)) dependentsByTask.set(d.dependsOnTaskId, []);
        dependentsByTask.get(d.dependsOnTaskId)!.push({ id: d.dep.id, title: d.dep.title, status: d.dep.status, dueDate: d.dep.dueDate, ticketNumber: d.dep.ticketNumber, assignee: d.assignee, team: d.team });
      }
    } catch (_) {}

    return results.map(result => {
      const deps = depsByTask.get(result.task.id) || [];
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
        blockedBy: deps.some(d => d.status !== 'done'),
      };
    });
  }

  async getTask(id: string): Promise<TaskWithDetails | undefined> {
    const assigneeAlias = alias(users, 'assignee');
    const creatorAlias = alias(users, 'creator');

    const [result] = await db
      .select({ task: tasks, assignee: assigneeAlias, creator: creatorAlias, team: teams, board: boards })
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
      const tagRows = await db.select({ tag: tags }).from(taskTags).innerJoin(tags, eq(taskTags.tagId, tags.id)).where(eq(taskTags.taskId, id));
      taskTagList = tagRows.map(r => r.tag);
    } catch (_) {}

    const deps = await this.getTaskDependencies(id);
    const dependents = await this.getTaskDependents(id);

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
      blockedBy: deps.some(d => d.status !== 'done'),
    };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db.update(tasks).set({ ...task, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
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
    const [updated] = await db.update(subtasks).set(subtask).where(eq(subtasks.id, id)).returning();
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
      return rows.filter(r => r.team).map(r => ({ ...r.team!, assignee: r.assignee }));
    } catch (_) { return []; }
  }

  async addTaskShare(taskId: string, teamId: string): Promise<void> {
    await db.insert(taskShares).values({ taskId, teamId }).onConflictDoNothing();
  }

  async removeTaskShare(taskId: string, teamId: string): Promise<void> {
    await db.delete(taskShares).where(and(eq(taskShares.taskId, taskId), eq(taskShares.teamId, teamId)));
  }

  async setShareAssignee(taskId: string, teamId: string, assigneeId: string | null): Promise<void> {
    await db.update(taskShares).set({ assigneeId }).where(and(eq(taskShares.taskId, taskId), eq(taskShares.teamId, teamId)));
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
    const rows = await db.select({ tag: tags }).from(taskTags).innerJoin(tags, eq(taskTags.tagId, tags.id)).where(eq(taskTags.taskId, taskId));
    return rows.map(r => r.tag);
  }

  async addTaskTag(taskId: string, tagId: string): Promise<void> {
    await db.insert(taskTags).values({ taskId, tagId }).onConflictDoNothing();
  }

  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    await db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
  }

  // ── Dependencies ────────────────────────────────────────────
  async getTaskDependencies(taskId: string): Promise<TaskSummary[]> {
    try {
      const depTaskAlias = alias(tasks, 'depTask');
      const depAssigneeAlias = alias(users, 'depAssignee');
      const depTeamAlias = alias(teams, 'depTeam');
      const rows = await db
        .select({ dep: depTaskAlias, assignee: depAssigneeAlias, team: depTeamAlias })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.dependsOnTaskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(eq(taskDependencies.taskId, taskId));
      return rows.map(r => ({ id: r.dep.id, title: r.dep.title, status: r.dep.status, dueDate: r.dep.dueDate, ticketNumber: r.dep.ticketNumber, assignee: r.assignee, team: r.team }));
    } catch (_) { return []; }
  }

  async getTaskDependents(taskId: string): Promise<TaskSummary[]> {
    try {
      const depTaskAlias = alias(tasks, 'depTask');
      const depAssigneeAlias = alias(users, 'depAssignee');
      const depTeamAlias = alias(teams, 'depTeam');
      const rows = await db
        .select({ dep: depTaskAlias, assignee: depAssigneeAlias, team: depTeamAlias })
        .from(taskDependencies)
        .innerJoin(depTaskAlias, eq(taskDependencies.taskId, depTaskAlias.id))
        .leftJoin(depAssigneeAlias, eq(depTaskAlias.assigneeId, depAssigneeAlias.id))
        .leftJoin(depTeamAlias, eq(depTaskAlias.teamId, depTeamAlias.id))
        .where(eq(taskDependencies.dependsOnTaskId, taskId));
      return rows.map(r => ({ id: r.dep.id, title: r.dep.title, status: r.dep.status, dueDate: r.dep.dueDate, ticketNumber: r.dep.ticketNumber, assignee: r.assignee, team: r.team }));
    } catch (_) { return []; }
  }

  async addTaskDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    if (taskId === dependsOnTaskId) throw new Error("Uma tarefa não pode depender de si mesma");
    const reverseDeps = await this.getTaskDependencies(dependsOnTaskId);
    if (reverseDeps.some(d => d.id === taskId)) throw new Error("Isso criaria uma dependência circular");
    await db.insert(taskDependencies).values({ taskId, dependsOnTaskId }).onConflictDoNothing();
  }

  async removeTaskDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await db.delete(taskDependencies).where(and(eq(taskDependencies.taskId, taskId), eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)));
  }

  // ── Dashboard stats ────────────────────────────────────────
  async getDashboardStats(userId: string): Promise<{ totalTasks: number; criticalTasks: number; inProgressTasks: number; completedTasks: number }> {
    const userCondition = or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId));
    const count = (condition: any) =>
      db.select({ count: sql<number>`count(*)` }).from(tasks).where(condition).then(res => Number(res[0]?.count || 0));
    const [totalTasks, criticalTasks, inProgressTasks, completedTasks] = await Promise.all([
      count(userCondition),
      count(and(userCondition, eq(tasks.urgency, "critical"), eq(tasks.importance, "high"))),
      count(and(userCondition, eq(tasks.status, "in_progress"))),
      count(and(userCondition, eq(tasks.status, "done"))),
    ]);
    return { totalTasks, criticalTasks, inProgressTasks, completedTasks };
  }

  async getTeamDashboardStats(teamId: string): Promise<{
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byAssignee: { userId: string; name: string; count: number }[];
    completionTrend: { date: string; count: number }[];
  }> {
    const teamTasks = await db.select().from(tasks).where(eq(tasks.teamId, teamId));

    const byStatus: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0, renegotiated: 0 };
    const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const assigneeCounts = new Map<string, number>();

    for (const t of teamTasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      if (t.assigneeId) assigneeCounts.set(t.assigneeId, (assigneeCounts.get(t.assigneeId) || 0) + 1);
    }

    const assigneeIds = Array.from(assigneeCounts.keys());
    let byAssignee: { userId: string; name: string; count: number }[] = [];
    if (assigneeIds.length > 0) {
      const assigneeUsers = await db.select().from(users).where(inArray(users.id, assigneeIds));
      byAssignee = assigneeUsers.map(u => ({
        userId: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        count: assigneeCounts.get(u.id) || 0,
      })).sort((a, b) => b.count - a.count).slice(0, 8);
    }

    // Completion trend: last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const completedTasks = teamTasks.filter(t => t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo);
    const trendMap = new Map<string, number>();
    for (const t of completedTasks) {
      if (t.completedAt) {
        const dateStr = new Date(t.completedAt).toISOString().split('T')[0];
        trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
      }
    }
    const completionTrend = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

    return { byStatus, byPriority, byAssignee, completionTrend };
  }

  // ── Team Events ────────────────────────────────────────────
  async getTeamEvents(teamId: string): Promise<TeamEvent[]> {
    return await db.select().from(teamEvents).where(eq(teamEvents.teamId, teamId)).orderBy(asc(teamEvents.startAt));
  }

  async createTeamEvent(data: InsertTeamEvent): Promise<TeamEvent> {
    const [event] = await db.insert(teamEvents).values(data).returning();
    return event;
  }

  async updateTeamEvent(id: string, data: Partial<InsertTeamEvent>): Promise<TeamEvent> {
    const [updated] = await db.update(teamEvents).set(data).where(eq(teamEvents.id, id)).returning();
    return updated;
  }

  async deleteTeamEvent(id: string): Promise<void> {
    await db.delete(teamEvents).where(eq(teamEvents.id, id));
  }

  // ── Skills ─────────────────────────────────────────────────
  async getSkillDefinitions(): Promise<SkillDefinition[]> {
    return await db.select().from(skillDefinitions).orderBy(skillDefinitions.type, skillDefinitions.name);
  }

  async createSkillDefinition(data: InsertSkillDefinition): Promise<SkillDefinition> {
    const [skill] = await db.insert(skillDefinitions).values(data).returning();
    return skill;
  }

  async deleteSkillDefinition(id: string): Promise<void> {
    await db.delete(skillDefinitions).where(eq(skillDefinitions.id, id));
  }

  // ── Member Evaluations ─────────────────────────────────────
  async getMemberEvaluations(teamId: string, userId: string): Promise<MemberEvaluationWithSkill[]> {
    const rows = await db
      .select({ eval: memberEvaluations, skill: skillDefinitions })
      .from(memberEvaluations)
      .innerJoin(skillDefinitions, eq(memberEvaluations.skillId, skillDefinitions.id))
      .where(and(eq(memberEvaluations.teamId, teamId), eq(memberEvaluations.userId, userId)));
    return rows.map(r => ({ ...r.eval, skill: r.skill }));
  }

  async upsertEvaluation(data: InsertMemberEvaluation): Promise<MemberEvaluation> {
    const existing = await db
      .select()
      .from(memberEvaluations)
      .where(and(
        eq(memberEvaluations.teamId, data.teamId),
        eq(memberEvaluations.userId, data.userId),
        eq(memberEvaluations.skillId, data.skillId),
      ));

    if (existing.length > 0) {
      const [updated] = await db
        .update(memberEvaluations)
        .set({ score: data.score, notes: data.notes, evaluatorId: data.evaluatorId, evaluatedAt: new Date() })
        .where(eq(memberEvaluations.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(memberEvaluations).values(data).returning();
    return created;
  }

  // ── Team Settings ──────────────────────────────────────────
  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    const [settings] = await db.select().from(teamSettings).where(eq(teamSettings.teamId, teamId));
    return settings ?? { teamId, dashboardPublic: false };
  }

  async upsertTeamSettings(teamId: string, data: Partial<TeamSettings>): Promise<TeamSettings> {
    const [result] = await db
      .insert(teamSettings)
      .values({ teamId, ...data })
      .onConflictDoUpdate({ target: teamSettings.teamId, set: data })
      .returning();
    return result;
  }

  // ── Task Templates ─────────────────────────────────────────
  async getTaskTemplates(teamId?: string): Promise<TaskTemplate[]> {
    const conditions = teamId
      ? or(eq(taskTemplates.teamId, teamId), sql`${taskTemplates.teamId} IS NULL`)
      : undefined;
    return await db.select().from(taskTemplates).where(conditions).orderBy(taskTemplates.title);
  }

  async createTaskTemplate(data: InsertTaskTemplate): Promise<TaskTemplate> {
    const [template] = await db.insert(taskTemplates).values(data).returning();
    return template;
  }

  async deleteTaskTemplate(id: string): Promise<void> {
    await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
  }

  // ── Notifications ──────────────────────────────────────────
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(data).returning();
    return notif;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  // ── Onboarding ─────────────────────────────────────────────
  async getOnboardingItems(teamId: string): Promise<OnboardingItem[]> {
    return await db.select().from(onboardingItems).where(eq(onboardingItems.teamId, teamId)).orderBy(asc(onboardingItems.order));
  }

  async createOnboardingItem(data: InsertOnboardingItem): Promise<OnboardingItem> {
    const [item] = await db.insert(onboardingItems).values(data).returning();
    return item;
  }

  async deleteOnboardingItem(id: string): Promise<void> {
    await db.delete(onboardingItems).where(eq(onboardingItems.id, id));
  }

  async getOnboardingProgress(teamId: string): Promise<OnboardingItemWithProgress[]> {
    const items = await this.getOnboardingItems(teamId);
    if (items.length === 0) return [];
    const itemIds = items.map(i => i.id);
    const progressRows = await db
      .select()
      .from(onboardingProgress)
      .where(inArray(onboardingProgress.itemId, itemIds));
    const progressByItem = new Map<string, string[]>();
    for (const p of progressRows) {
      if (!progressByItem.has(p.itemId)) progressByItem.set(p.itemId, []);
      progressByItem.get(p.itemId)!.push(p.userId);
    }
    return items.map(item => ({ ...item, completedBy: progressByItem.get(item.id) || [] }));
  }

  async toggleOnboardingProgress(itemId: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(onboardingProgress)
      .where(and(eq(onboardingProgress.itemId, itemId), eq(onboardingProgress.userId, userId)));
    if (existing) {
      await db.delete(onboardingProgress).where(and(eq(onboardingProgress.itemId, itemId), eq(onboardingProgress.userId, userId)));
    } else {
      await db.insert(onboardingProgress).values({ itemId, userId }).onConflictDoNothing();
    }
  }
}

export const storage = new DatabaseStorage();
