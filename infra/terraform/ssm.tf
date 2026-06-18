resource "aws_ssm_parameter" "database_url" {
  name        = "/${var.project}/${var.environment}/database-url"
  description = "ShipNexus Postgres connection string"
  type        = "SecureString"
  value       = "REPLACE_WITH_REAL_DATABASE_URL"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${local.name_prefix}-database-url" }
}

resource "aws_ssm_parameter" "redis_url" {
  name        = "/${var.project}/${var.environment}/redis-url"
  description = "ShipNexus Redis connection string"
  type        = "SecureString"
  value       = "REPLACE_WITH_REAL_REDIS_URL"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${local.name_prefix}-redis-url" }
}

resource "aws_ssm_parameter" "github_webhook_secret" {
  name        = "/${var.project}/${var.environment}/github-webhook-secret"
  description = "GitHub webhook HMAC signing secret"
  type        = "SecureString"
  value       = "REPLACE_WITH_REAL_WEBHOOK_SECRET"

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${local.name_prefix}-github-webhook-secret" }
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project}/${var.environment}/db-password"
  description = "RDS Postgres master password"
  type        = "SecureString"
  value       = var.db_password

  lifecycle {
    ignore_changes = [value]
  }

  tags = { Name = "${local.name_prefix}-db-password" }
}

output "ssm_database_url_arn" {
  value = aws_ssm_parameter.database_url.arn
}

output "ssm_redis_url_arn" {
  value = aws_ssm_parameter.redis_url.arn
}

output "ssm_github_webhook_secret_arn" {
  value = aws_ssm_parameter.github_webhook_secret.arn
}
