# ── API ECS Service ───────────────────────────────────────────────────────────
# Runs in private subnets; ALB routes public traffic to its registered tasks

resource "aws_ecs_service" "api" {
  name            = "${local.name_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  # Replace running tasks one at a time during deployments
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false   # private subnets — NAT Gateway handles outbound
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.api_container_port
  }

  # Circuit breaker — automatically rolls back a deployment if tasks fail
  # to reach RUNNING state; avoids being stuck on a broken task definition
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # Ignore task_definition changes in Terraform after initial deploy
  # CI/CD pipeline manages image updates via UpdateService, not Terraform
  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_task_execution,
  ]

  tags = { Name = "${local.name_prefix}-api-service" }
}

# ── Worker ECS Service ────────────────────────────────────────────────────────
# Runs in private subnets; no ALB — outbound SQS polling only

resource "aws_ecs_service" "worker" {
  name            = "${local.name_prefix}-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution,
  ]

  tags = { Name = "${local.name_prefix}-worker-service" }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "api_service_name" {
  description = "ECS API service name"
  value       = aws_ecs_service.api.name
}

output "worker_service_name" {
  description = "ECS Worker service name"
  value       = aws_ecs_service.worker.name
}
