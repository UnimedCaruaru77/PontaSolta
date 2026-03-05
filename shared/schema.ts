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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
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
  passwordHash: varchar("password_hash"), // For traditional email/password auth
  googleId: varchar("google_id").unique(), // For Google OAuth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("member"), // member, manager, admin
  teamId: varchar("team_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const urgencyEnum = pgEnum("urgency", ["low", "medium", "high", "critical"]);
export const importanceEnum = pgEnum("importance", ["low", "medium", "high"]);
export const complexityEnum = pgEnum("complexity", ["simple", "medium", "complex"]);
export const statusEnum = pgEnum("status", ["todo", "in_progress", "review", "done"]);

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: priorityEnum("priority").notNull().default("medium"),
  urgency: urgencyEnum("urgency").notNull().default("medium"),
  importance: importanceEnum("importance").notNull().default("medium"),
  complexity: complexityEnum("complexity").notNull().default("medium"),
  status: statusEnum("status").notNull().default("todo"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  teamId: varchar("team_id").references(() => teams.id),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
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
  action: varchar("action").notNull(), // created, updated, status_changed, assigned, etc.
  field: varchar("field"), // field that changed (status, assignee, priority, etc.)
  oldValue: text("old_value"), // JSON string of old value
  newValue: text("new_value"), // JSON string of new value
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  subtasks: many(subtasks),
  comments: many(taskComments),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
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
  team: one(teams, {
    fields: [tasks.teamId],
    references: [teams.id],
  }),
  subtasks: many(subtasks),
  comments: many(taskComments),
  auditLogs: many(taskAuditLog),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
  assignee: one(users, {
    fields: [subtasks.assigneeId],
    references: [users.id],
  }),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const taskAuditLogRelations = relations(taskAuditLog, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAuditLog.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAuditLog.userId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export const insertTaskSchema = createInsertSchema(tasks)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    startDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
  });

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = typeof subtasks.$inferInsert;
export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
  createdAt: true,
});

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
});

export type TaskAuditLog = typeof taskAuditLog.$inferSelect;
export type InsertTaskAuditLog = typeof taskAuditLog.$inferInsert;
export const insertTaskAuditLogSchema = createInsertSchema(taskAuditLog).omit({
  id: true,
  createdAt: true,
});

// Extended types with relations
export type TaskWithDetails = Task & {
  assignee?: User | null;
  creator: User;
  team?: Team | null;
  subtasks: Subtask[];
  comments: (TaskComment & { user: User })[];
  auditLogs?: (TaskAuditLog & { user: User })[];
};
