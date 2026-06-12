CREATE TYPE "public"."deployment_status" AS ENUM('pending', 'queued', 'running', 'success', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "deployment_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"image_tag" varchar(255) NOT NULL,
	"environment" varchar(64) DEFAULT 'production' NOT NULL,
	"status" "deployment_status" DEFAULT 'pending' NOT NULL,
	"triggered_by" varchar(255) NOT NULL,
	"payload" jsonb,
	"error_message" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
