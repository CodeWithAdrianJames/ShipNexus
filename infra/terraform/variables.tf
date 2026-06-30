# ── Core ──────────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Deployment environment (production | staging | development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "environment must be one of: production, staging, development"
  }
}

variable "project" {
  description = "Project name — used as a prefix on all resources"
  type        = string
  default     = "shipnexus"
}

# ── Networking ────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to spread subnets across (minimum 2 for ALB)"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ── SQS ───────────────────────────────────────────────────────────────────────

variable "sqs_message_retention_seconds" {
  description = "How long SQS retains unprocessed messages (default 4 days)"
  type        = number
  default     = 345600
}

variable "sqs_visibility_timeout_seconds" {
  description = "Visibility timeout — must exceed max job processing time"
  type        = number
  default     = 900
}

# ── ECS ───────────────────────────────────────────────────────────────────────

variable "api_container_port" {
  description = "Port the NestJS API container listens on"
  type        = number
  default     = 3000
}

variable "api_cpu" {
  description = "CPU units for the API task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory (MB) for the API task"
  type        = number
  default     = 1024
}

variable "worker_cpu" {
  description = "CPU units for the Worker task"
  type        = number
  default     = 256
}

variable "worker_memory" {
  description = "Memory (MB) for the Worker task"
  type        = number
  default     = 512
}
# ── RDS ───────────────────────────────────────────────────────────────────────

variable "db_password" {
  description = "RDS Postgres master password — use a strong random value in production"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 16
    error_message = "db_password must be at least 16 characters"
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

# ── ElastiCache ───────────────────────────────────────────────────────────────

variable "redis_auth_token" {
  description = "ElastiCache Redis AUTH token — minimum 16 characters"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.redis_auth_token) >= 16
    error_message = "redis_auth_token must be at least 16 characters"
  }
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}
