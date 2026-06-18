resource "aws_elasticache_subnet_group" "main" {
  name        = "${local.name_prefix}-redis-subnet-group"
  description = "Private subnets for ElastiCache Redis"
  subnet_ids  = aws_subnet.private[*].id

  tags = { Name = "${local.name_prefix}-redis-subnet-group" }
}

resource "aws_elasticache_parameter_group" "main" {
  name        = "${local.name_prefix}-redis7"
  family      = "redis7"
  description = "ShipNexus Redis 7 parameter group"

  parameter {
    name  = "activerehashing"
    value = "yes"
  }

  tags = { Name = "${local.name_prefix}-redis7" }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${local.name_prefix}-redis"
  description          = "ShipNexus Redis — distributed locks and caching"

  node_type          = "cache.t4g.micro"
  num_cache_clusters = 1
  port               = 6379

  engine               = "redis"
  engine_version       = "7.1"
  parameter_group_name = aws_elasticache_parameter_group.main.name

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token

  snapshot_retention_limit = 1
  snapshot_window          = "05:00-06:00"

  automatic_failover_enabled = false
  multi_az_enabled           = false

  apply_immediately = false

  tags = { Name = "${local.name_prefix}-redis" }
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_replication_group.main.port
}
