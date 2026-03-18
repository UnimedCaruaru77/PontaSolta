import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  googleId: varchar("google_id").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("member"), // member, manager, admin
  teamId: varchar("team_id"), // kept for backward compat
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Many-to-many: users <-> teams (with isLead flag)
export const teamMembers = pgTable("team_members", {
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isLead: boolean("is_lead").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [primaryKey({ columns: [table.teamId, table.userId] })]);

// Boards belong to a team
export const boards = pgTable("boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const urgencyEnum = pgEnum("urgency", ["low", "medium", "high", "critical"]);
export const importanceEnum = pgEnum("importance", ["low", "medium", "high"]);
export const complexityEnum = pgEnum("complexity", ["simple", "medium", "complex"]);
export const statusEnum = pgEnum("status", ["todo", "in_progress", "review", "done", "renegotiated"]);

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  ticketNumber: varchar("ticket_number"),
  priority: priorityEnum("priority").notNull().default("medium"),
  urgency: urgencyEnum("urgency").notNull().default("medium"),
  importance: importanceEnum("importance").notNull().default("medium"),
  complexity: complexityEnum("complexity").notNull().default("medium"),
  status: statusEnum("status").notNull().default("todo"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  teamId: varchar("team_id").references(() => teams.id),
  boardId: varchar("board_id").references(() => boards.id),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  renegotiationCount: integer("renegotiation_count").notNull().default(0),
  lastRenegotiatedAt: timestamp("last_renegotiated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subtasks = pgTable("subtasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  completed: boolean("completed").default(false),
  assigneeId: varchar("assignee_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskAuditLog = pgTable("task_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(),
  field: varchar("field"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskShares = pgTable("task_shares", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }),
  sharedAt: timestamp("shared_at").defaultNow(),
}, (table) => [primaryKey({ columns: [table.taskId, table.teamId] })]);

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  color: varchar("color").notNull().default("#22c55e"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskTags = pgTable("task_tags", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.taskId, table.tagId] })]);

export const taskDependencies = pgTable("task_dependencies", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: varchar("depends_on_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [primaryKey({ columns: [table.taskId, table.dependsOnTaskId] })]);

// ─── NEW TABLES ────────────────────────────────────────────────────────────

// Team events (calendar)
export const teamEvents = pgTable("team_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  location: varchar("location"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Skill definitions (technical or behavioral)
export const skillDefinitions = pgTable("skill_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull().default("technical"), // 'technical' | 'behavioral'
  createdAt: timestamp("created_at").defaultNow(),
});

// Member performance evaluations
export const memberEvaluations = pgTable("member_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  evaluatorId: varchar("evaluator_id").notNull().references(() => users.id),
  skillId: varchar("skill_id").notNull().references(() => skillDefinitions.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(3), // 1-5
  notes: text("notes"),
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
});

// Per-team settings
export const teamSettings = pgTable("team_settings", {
  teamId: varchar("team_id").primaryKey().references(() => teams.id, { onDelete: "cascade" }),
  dashboardPublic: boolean("dashboard_public").default(false),
});

// Task templates
export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").default("medium"),
  urgency: varchar("urgency").default("medium"),
  importance: varchar("importance").default("medium"),
  complexity: varchar("complexity").default("medium"),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Internal notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("info"), // 'info' | 'warning' | 'task' | 'announcement'
  read: boolean("read").default(false),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Onboarding checklist items per team
export const onboardingItems = pgTable("onboarding_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Per-user onboarding progress
export const onboardingProgress = pgTable("onboarding_progress", {
  itemId: varchar("item_id").notNull().references(() => onboardingItems.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
}, (table) => [primaryKey({ columns: [table.itemId, table.userId] })]);

// ─── RELATIONS ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  subtasks: many(subtasks),
  comments: many(taskComments),
  notifications: many(notifications),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  members: many(teamMembers),
  boards: many(boards),
  tasks: many(tasks),
  events: many(teamEvents),
  settings: one(teamSettings, { fields: [teams.id], references: [teamSettings.teamId] }),
  onboardingItems: many(onboardingItems),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  team: one(teams, { fields: [boards.teamId], references: [teams.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id], relationName: "assignedTasks" }),
  creator: one(users, { fields: [tasks.creatorId], references: [users.id], relationName: "createdTasks" }),
  team: one(teams, { fields: [tasks.teamId], references: [teams.id] }),
  board: one(boards, { fields: [tasks.boardId], references: [boards.id] }),
  subtasks: many(subtasks),
  comments: many(taskComments),
  auditLogs: many(taskAuditLog),
  dependencies: many(taskDependencies, { relationName: "taskDeps" }),
  dependents: many(taskDependencies, { relationName: "taskDependents" }),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, { fields: [subtasks.taskId], references: [tasks.id] }),
  assignee: one(users, { fields: [subtasks.assigneeId], references: [users.id] }),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, { fields: [taskComments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskComments.userId], references: [users.id] }),
}));

export const taskAuditLogRelations = relations(taskAuditLog, ({ one }) => ({
  task: one(tasks, { fields: [taskAuditLog.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAuditLog.userId], references: [users.id] }),
}));

export const taskSharesRelations = relations(taskShares, ({ one }) => ({
  task: one(tasks, { fields: [taskShares.taskId], references: [tasks.id] }),
  team: one(teams, { fields: [taskShares.teamId], references: [teams.id] }),
  assignee: one(users, { fields: [taskShares.assigneeId], references: [users.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
  task: one(tasks, { fields: [taskDependencies.taskId], references: [tasks.id], relationName: "taskDeps" }),
  dependsOn: one(tasks, { fields: [taskDependencies.dependsOnTaskId], references: [tasks.id], relationName: "taskDependents" }),
}));

export const teamEventsRelations = relations(teamEvents, ({ one }) => ({
  team: one(teams, { fields: [teamEvents.teamId], references: [teams.id] }),
  creator: one(users, { fields: [teamEvents.createdBy], references: [users.id] }),
}));

export const skillDefinitionsRelations = relations(skillDefinitions, ({ many }) => ({
  evaluations: many(memberEvaluations),
}));

export const memberEvaluationsRelations = relations(memberEvaluations, ({ one }) => ({
  team: one(teams, { fields: [memberEvaluations.teamId], references: [teams.id] }),
  user: one(users, { fields: [memberEvaluations.userId], references: [users.id] }),
  evaluator: one(users, { fields: [memberEvaluations.evaluatorId], references: [users.id] }),
  skill: one(skillDefinitions, { fields: [memberEvaluations.skillId], references: [skillDefinitions.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  task: one(tasks, { fields: [notifications.taskId], references: [tasks.id] }),
}));

export const onboardingItemsRelations = relations(onboardingItems, ({ one, many }) => ({
  team: one(teams, { fields: [onboardingItems.teamId], references: [teams.id] }),
  progress: many(onboardingProgress),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  item: one(onboardingItems, { fields: [onboardingProgress.itemId], references: [onboardingItems.id] }),
  user: one(users, { fields: [onboardingProgress.userId], references: [users.id] }),
}));

export const taskTemplatesRelations = relations(taskTemplates, ({ one }) => ({
  team: one(teams, { fields: [taskTemplates.teamId], references: [teams.id] }),
  creator: one(users, { fields: [taskTemplates.createdBy], references: [users.id] }),
}));

// ─── TYPES ─────────────────────────────────────────────────────────────────

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });

export type Board = typeof boards.$inferSelect;
export type InsertBoard = typeof boards.$inferInsert;
export const insertBoardSchema = createInsertSchema(boards).omit({ id: true, createdAt: true });

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.union([z.coerce.date(), z.null()]).optional(),
    dueDate: z.union([z.coerce.date(), z.null()]).optional(),
    completedAt: z.union([z.coerce.date(), z.null()]).optional(),
    lastRenegotiatedAt: z.union([z.coerce.date(), z.null()]).optional(),
  });

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = typeof subtasks.$inferInsert;
export const insertSubtaskSchema = createInsertSchema(subtasks).omit({ id: true, createdAt: true });

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });

export type TaskAuditLog = typeof taskAuditLog.$inferSelect;
export type InsertTaskAuditLog = typeof taskAuditLog.$inferInsert;
export const insertTaskAuditLogSchema = createInsertSchema(taskAuditLog).omit({ id: true, createdAt: true });

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });

export type TaskDependency = typeof taskDependencies.$inferSelect;

export type TeamMember = typeof teamMembers.$inferSelect;

export type TeamEvent = typeof teamEvents.$inferSelect;
export type InsertTeamEvent = typeof teamEvents.$inferInsert;
export const insertTeamEventSchema = createInsertSchema(teamEvents).omit({ id: true, createdAt: true }).extend({
  startAt: z.coerce.date(),
  endAt: z.union([z.coerce.date(), z.null()]).optional(),
});

export type SkillDefinition = typeof skillDefinitions.$inferSelect;
export type InsertSkillDefinition = typeof skillDefinitions.$inferInsert;
export const insertSkillDefinitionSchema = createInsertSchema(skillDefinitions).omit({ id: true, createdAt: true });

export type MemberEvaluation = typeof memberEvaluations.$inferSelect;
export type InsertMemberEvaluation = typeof memberEvaluations.$inferInsert;
export const insertMemberEvaluationSchema = createInsertSchema(memberEvaluations).omit({ id: true, evaluatedAt: true });

export type TeamSettings = typeof teamSettings.$inferSelect;

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = typeof taskTemplates.$inferInsert;
export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({ id: true, createdAt: true });

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

export type OnboardingItem = typeof onboardingItems.$inferSelect;
export type InsertOnboardingItem = typeof onboardingItems.$inferInsert;
export const insertOnboardingItemSchema = createInsertSchema(onboardingItems).omit({ id: true, createdAt: true });

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// Shared team with optional assignee
export type SharedTeamWithAssignee = Team & { assignee?: User | null };

// Task summary for dependency display
export type TaskSummary = Pick<Task, 'id' | 'title' | 'status' | 'dueDate' | 'ticketNumber'> & {
  assignee?: User | null;
  team?: Team | null;
};

// Extended types
export type TaskWithDetails = Task & {
  assignee?: User | null;
  creator: User;
  team?: Team | null;
  board?: Board | null;
  subtasks: Subtask[];
  comments: (TaskComment & { user: User })[];
  auditLogs?: (TaskAuditLog & { user: User })[];
  sharedTeams?: SharedTeamWithAssignee[];
  tags?: Tag[];
  dependencies?: TaskSummary[];
  dependents?: TaskSummary[];
  blockedBy?: boolean;
  isSharedWithCurrentTeam?: boolean;
};

export type BoardWithTeam = Board & { team: Team };

export type TeamMemberWithUser = TeamMember & { user: User };
export type TeamWithMembers = Team & { members: (User & { isLead?: boolean })[]; boards: Board[] };

export type MemberEvaluationWithSkill = MemberEvaluation & { skill: SkillDefinition };

export type OnboardingItemWithProgress = OnboardingItem & {
  completedBy: string[];
};

export type NotificationWithTask = Notification & { task?: Task | null };
