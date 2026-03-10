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

// Many-to-many: users <-> teams
export const teamMembers = pgTable("team_members", {
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// Task sharing: a card can be shared with multiple teams (for shared merit)
// Each share can have a designated assignee from the secondary team
export const taskShares = pgTable("task_shares", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }),
  sharedAt: timestamp("shared_at").defaultNow(),
}, (table) => [primaryKey({ columns: [table.taskId, table.teamId] })]);

// Color labels (tags) for tasks
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  color: varchar("color").notNull().default("#22c55e"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Many-to-many: tasks <-> tags
export const taskTags = pgTable("task_tags", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.taskId, table.tagId] })]);

// Task dependencies: taskId depends on / is blocked by dependsOnTaskId
export const taskDependencies = pgTable("task_dependencies", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: varchar("depends_on_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [primaryKey({ columns: [table.taskId, table.dependsOnTaskId] })]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  subtasks: many(subtasks),
  comments: many(taskComments),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  boards: many(boards),
  tasks: many(tasks),
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
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  creator: one(users, {
    fields: [tasks.creatorId],
    references: [users.id],
    relationName: "createdTasks",
  }),
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

// Types
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
};

export type BoardWithTeam = Board & { team: Team };
export type TeamWithMembers = Team & { members: User[]; boards: Board[] };
