import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const deploymentStatusEnum = pgEnum('deployment_status', [
  'pending',
  'queued',
  'running',
  'success',
  'failed',
  'cancelled',
]);

export const deploymentJobs = pgTable('deployment_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What is being deployed
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  imageTag:    varchar('image_tag',    { length: 255 }).notNull(),
  environment: varchar('environment',  { length: 64  }).notNull().default('production'),

  // Lifecycle tracking
  status:      deploymentStatusEnum('status').notNull().default('pending'),
  triggeredBy: varchar('triggered_by', { length: 255 }).notNull(),

  // Raw webhook body — invaluable for replaying or debugging failed jobs
  payload: jsonb('payload'),

  // Error capture when status = 'failed'
  errorMessage: varchar('error_message', { length: 2048 }),

  // Timestamps — all UTC
  createdAt:   timestamp('created_at',   { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at',   { withTimezone: true }).notNull().defaultNow(),
  startedAt:   timestamp('started_at',   { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Drizzle inferred types — used throughout the app for type safety
export type DeploymentJob        = typeof deploymentJobs.$inferSelect;
export type NewDeploymentJob     = typeof deploymentJobs.$inferInsert;
export type DeploymentStatus     = (typeof deploymentStatusEnum.enumValues)[number];