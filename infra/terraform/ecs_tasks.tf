# ── CloudWatch Log Groups ─────────────────────────────────────────────────────
# One log group per service — keeps API and Worker logs cleanly separated

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name_prefix}/api"
  retention_in_days = 30

  tags = { Name = "${local.name_prefix}-api-logs" }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${local.name_prefix}/worker"
  retention_in_days = 30

  tags = { Name = "${local.name_prefix}-worker-logs" }
}

# ── API Task Definition ───────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name_prefix}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      # Placeholder image — CI/CD pipeline overwrites this on every deploy
      image = "nginx:alpine"

      portMappings = [
        {
          containerPort = var.api_container_port
          protocol      = "tcp"
        }
      ]

      # Plain environment variables (non-sensitive)
      environment = [
        { name = "NODE_ENV",    value = var.environment },
        { name = "PORT",        value = tostring(var.api_container_port) },
        { name = "AWS_REGION",  value = var.aws_region },
      ]

      # Sensitive values pulled from SSM at task startup — never baked into image
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = aws_ssm_parameter.redis_url.arn
        },
        {
          name      = "GITHUB_WEBHOOK_SECRET"
          valueFrom = aws_ssm_parameter.github_webhook_secret.arn
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }

      essential    = true
      readonlyRootFilesystem = false
    }
  ])

  tags = { Name = "${local.name_prefix}-api-task" }
}

# ── Worker Task Definition ────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.name_prefix}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "worker"
      image = "nginx:alpine"

      # No port mappings — Worker is outbound only (SQS polling, ECS SDK calls)

      environment = [
        { name = "NODE_ENV",                  value = var.environment },
        { name = "AWS_REGION",                value = var.aws_region },
        { name = "SQS_QUEUE_NAME",            value = "${local.name_prefix}-deployments.fifo" },
        { name = "SQS_VISIBILITY_TIMEOUT",    value = tostring(var.sqs_visibility_timeout_seconds) },
        { name = "SQS_WAIT_TIME_SECONDS",     value = "20" },
        { name = "ECS_CLUSTER_NAME",          value = aws_ecs_cluster.main.name },
        { name = "ECS_SKIP_STABILITY_POLL",   value = "false" },
        { name = "ECS_DRY_RUN",               value = "false" },
        { name = "ECS_POLL_INTERVAL_MS",      value = "15000" },
        { name = "ECS_POLL_MAX_ATTEMPTS",     value = "40" },
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = aws_ssm_parameter.redis_url.arn
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.worker.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }

      essential    = true
      readonlyRootFilesystem = false
    }
  ])

  tags = { Name = "${local.name_prefix}-worker-task" }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "api_task_definition_arn" {
  description = "API task definition ARN"
  value       = aws_ecs_task_definition.api.arn
}

output "worker_task_definition_arn" {
  description = "Worker task definition ARN"
  value       = aws_ecs_task_definition.worker.arn
}
