# ShipNexus

A production-grade deployment pipeline orchestration platform. GitHub webhooks trigger deployments that are persisted to PostgreSQL, published to SQS FIFO, and processed by an ECS Fargate worker — with a Next.js dashboard for real-time visibility.

---

## Architecture

```
GitHub Webhook
      │
      ▼
Application Load Balancer  (public subnet)
      │
      ▼
NestJS API  (private subnet, ECS Fargate)
  ├── HMAC-SHA256 signature verification
  ├── Validates request via class-validator
  ├── Writes deployment_jobs row → PostgreSQL
  └── Publishes { jobId } → SQS FIFO (Claim Check pattern)
      │
      ▼
SQS FIFO Queue  (per-service ordering + deduplication)
      │
      ▼
Worker  (private subnet, ECS Fargate)
  ├── Long-polls SQS
  ├── Acquires distributed Redis lock (ownership token + Lua CAS)
  ├── Fetches full job from PostgreSQL (Claim Check resolution)
  ├── Walks job through: pending → queued → running → success/failed
  ├── Calls ECS UpdateService (forceNewDeployment: true)
  ├── Polls DescribeServices until stable or timeout
  └── Deletes SQS message only on success

Next.js Dashboard  (Server Component → direct Postgres read)
  └── Displays live job table with status badges + auto-refresh
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| Claim Check pattern | Only `jobId` travels over SQS — full payload stays in Postgres. No 256KB size limits, single source of truth, full audit trail. |
| SQS FIFO queue | Guarantees per-service ordering. `MessageGroupId = serviceName` ensures `payments-service` deployments never race each other. |
| `webhookEventId` deduplication | GitHub retries webhooks. Stable upstream key as `MessageDeduplicationId` prevents double deployments within the 5-minute SQS dedup window. |
| Redis ownership lock | `SET NX EX` with a UUID token + atomic Lua compare-and-delete prevents two worker instances from processing the same job, even after TTL expiry. |
| Conditional WHERE transitions | Every `pending→queued→running→success` update includes the expected current status in the WHERE clause. Zero affected rows = concurrent modification detected, skip. |
| HMAC-SHA256 + `timingSafeEqual` | Raw body captured before JSON parsing. Constant-time comparison prevents timing attacks. |
| Next.js Server Components → Postgres | Dashboard reads bypass the API entirely. No extra network hop. Points at a read replica in production. |
| `ECS_DRY_RUN` + `ECS_SKIP_STABILITY_POLL` | Clean local dev seams. Flip both to `false` in production for real ECS deployment calls and stability polling. |

---

## Tech Stack

**API & Worker**
- [NestJS](https://nestjs.com/) — module-based Node.js framework
- [Drizzle ORM](https://orm.drizzle.team/) — type-safe SQL with migration history
- [PostgreSQL 16](https://www.postgresql.org/) — deployment job ledger
- [Redis 7](https://redis.io/) — distributed locks
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) — SQS, ECS
- TypeScript

**Dashboard**
- [Next.js 15+](https://nextjs.org/) (App Router, Server Components)
- [TailwindCSS](https://tailwindcss.com/)

**Infrastructure**
- [AWS ECS Fargate](https://aws.amazon.com/fargate/) — serverless containers
- [AWS SQS FIFO](https://aws.amazon.com/sqs/) — ordered, deduplicated job queue
- [AWS ALB](https://aws.amazon.com/elasticloadbalancing/) — public ingress
- [AWS RDS PostgreSQL](https://aws.amazon.com/rds/) — managed database
- [AWS ElastiCache Redis](https://aws.amazon.com/elasticache/) — managed cache
- [AWS SSM Parameter Store](https://aws.amazon.com/systems-manager/) — secrets
- [Terraform](https://www.terraform.io/) — infrastructure as code
- [Docker + LocalStack](https://localstack.cloud/) — local AWS emulation

---

## Project Structure

```
shipnexus/
├── apps/
│   ├── api/                    # NestJS API
│   │   ├── src/
│   │   │   ├── database/       # Drizzle provider + schema
│   │   │   ├── deployments/    # Controller, service, DTO, HMAC guard
│   │   │   ├── sqs/            # SQS client wrapper
│   │   │   └── types/          # Express type augmentations
│   │   └── drizzle/            # Migration SQL files
│   ├── worker/                 # SQS polling worker
│   │   └── src/
│   │       ├── database/       # Drizzle provider + schema
│   │       ├── ecs/            # ECS deployment + stability polling
│   │       ├── lock/           # Redis distributed lock service
│   │       └── processor/      # SQS poll loop + job state machine
│   └── web/                    # Next.js dashboard
│       └── src/
│           ├── app/            # Server Component pages
│           ├── components/     # DeploymentDashboard, StatusBadge
│           └── database/       # Drizzle client (direct Postgres read)
├── infra/
│   ├── localstack/             # LocalStack init scripts
│   └── terraform/              # IaC for real AWS
│       ├── main.tf             # VPC, subnets, NAT, SQS, ECS cluster, IAM
│       ├── security_groups.tf  # ALB, ECS, RDS, Redis security groups
│       ├── rds.tf              # RDS PostgreSQL 16
│       ├── redis.tf            # ElastiCache Redis 7
│       ├── ssm.tf              # SSM SecureString parameters
│       ├── alb.tf              # ALB, target group, HTTP listener
│       ├── ecs_tasks.tf        # API + Worker task definitions
│       ├── ecs_services.tf     # API + Worker ECS services
│       ├── providers.tf        # AWS provider + Terraform version
│       └── variables.tf        # All input variables
├── scripts/
├── docker-compose.yml          # Local Postgres, Redis, LocalStack
└── package.json
```

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- AWS CLI (`pip install awscli awscli-local`)
- Terraform 1.6+

### 1. Start local infrastructure

```bash
docker compose up -d

# Verify all three services are healthy
docker ps --filter "name=shipnexus"
```

### 2. Set up the API

```bash
cd apps/api
cp .env.example .env    # fill in values (defaults work for local dev)

npm install
npm run db:migrate      # applies schema to local Postgres
npm run start:dev
```

### 3. Set up the Worker

```bash
cd apps/worker
cp .env.example .env    # ECS_DRY_RUN=true, ECS_SKIP_STABILITY_POLL=true for local

npm install
npm run start:dev
```

### 4. Set up the Dashboard

```bash
cd apps/web
# Create .env.local with DATABASE_URL pointing at local Postgres
echo "DATABASE_URL=postgres://shipnexus:shipnexus_secret@localhost:5433/shipnexus_db" > .env.local

npm install
npm run dev             # http://localhost:3001
```

### 5. Trigger a test deployment

```bash
PAYLOAD='{"serviceName":"payments-service","imageTag":"sha256-abc123","environment":"production","triggeredBy":"local-test","webhookEventId":"test-001","payload":{"ref":"refs/heads/main"}}'
SECRET="shipnexus_local_dev_secret"
SIG="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

curl -s -X POST http://localhost:3000/deployments \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: $SIG" \
  -d "$PAYLOAD" | python3 -m json.tool
```

Watch the worker logs for `pending → queued → running → success ✓`, then open the dashboard to see the completed job.

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Local default |
|----------|-------------|---------------|
| `DATABASE_URL` | Postgres connection string | `postgres://shipnexus:shipnexus_secret@localhost:5433/shipnexus_db` |
| `REDIS_URL` | Redis connection string | `redis://:redis_secret@localhost:6380` |
| `AWS_ENDPOINT_URL` | LocalStack endpoint | `http://localhost:4567` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS credentials | `test` |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | `test` |
| `GITHUB_WEBHOOK_SECRET` | HMAC signing secret | `shipnexus_local_dev_secret` |

### Worker (`apps/worker/.env`)

| Variable | Description | Local default |
|----------|-------------|---------------|
| `DATABASE_URL` | Postgres connection string | same as API |
| `REDIS_URL` | Redis connection string | same as API |
| `AWS_ENDPOINT_URL` | LocalStack endpoint | `http://localhost:4567` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS credentials | `test` |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | `test` |
| `SQS_QUEUE_NAME` | Queue name | `shipnexus-deployments.fifo` |
| `SQS_VISIBILITY_TIMEOUT` | Seconds (must exceed job duration) | `30` |
| `SQS_WAIT_TIME_SECONDS` | Long-poll duration | `20` |
| `ECS_CLUSTER_NAME` | Target ECS cluster | `shipnexus-local` |
| `ECS_DRY_RUN` | Skip real ECS calls | `true` |
| `ECS_SKIP_STABILITY_POLL` | Skip deployment polling | `true` |
| `ECS_POLL_INTERVAL_MS` | Polling interval | `3000` |
| `ECS_POLL_MAX_ATTEMPTS` | Max poll attempts | `10` |

---

## API Reference

### `POST /deployments`

Creates a deployment job and publishes it to the SQS queue. Requires a valid GitHub webhook HMAC signature.

**Headers**

```
Content-Type: application/json
x-hub-signature-256: sha256=<hmac>
```

**Body**

```json
{
  "serviceName": "payments-service",
  "imageTag": "sha256-abc123",
  "environment": "production",
  "triggeredBy": "github-webhook",
  "webhookEventId": "gh-evt-abc123",
  "payload": { "ref": "refs/heads/main" }
}
```

**Response** `201 Created`

```json
{
  "id": "uuid",
  "serviceName": "payments-service",
  "imageTag": "sha256-abc123",
  "environment": "production",
  "status": "pending",
  "triggeredBy": "github-webhook",
  "webhookEventId": "gh-evt-abc123",
  "createdAt": "2026-06-16T00:00:00.000Z",
  "updatedAt": "2026-06-16T00:00:00.000Z",
  "startedAt": null,
  "completedAt": null,
  "errorMessage": null,
  "payload": { "ref": "refs/heads/main" }
}
```

### `GET /deployments`

Returns all deployment jobs ordered by creation date.

---

## Job Lifecycle

```
POST /deployments received
        │
        ▼
    [ pending ]  ← written to DB + published to SQS
        │
        ▼  Worker acquires Redis lock
    [ queued ]   ← job acknowledged, processing begins
        │
        ▼  ECS UpdateService called
    [ running ]  ← startedAt stamped, stability poll begins
        │
   ┌────┴────┐
   ▼         ▼
[success] [failed]
  SQS msg   SQS msg retained
  deleted   for retry
```

---

## Database Schema

```sql
CREATE TYPE deployment_status AS ENUM (
  'pending', 'queued', 'running', 'success', 'failed', 'cancelled'
);

CREATE TABLE deployment_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name     VARCHAR(255) NOT NULL,
  image_tag        VARCHAR(255) NOT NULL,
  environment      VARCHAR(64)  NOT NULL DEFAULT 'production',
  status           deployment_status NOT NULL DEFAULT 'pending',
  triggered_by     VARCHAR(255) NOT NULL,
  webhook_event_id VARCHAR(255) UNIQUE,
  payload          JSONB,
  error_message    VARCHAR(2048),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);
```

---

## Infrastructure (Terraform)

All AWS resources are managed by Terraform in `infra/terraform/`.

### Resources provisioned

| Resource | Description |
|----------|-------------|
| VPC + subnets | 2 public + 2 private subnets across 2 AZs |
| NAT Gateways | One per AZ — allows private tasks to reach ECR, SQS, SSM |
| SQS FIFO + DLQ | 3-strike redrive policy; DLQ retains failed messages 14 days |
| ECS Fargate cluster | Container Insights enabled |
| ALB | Public ingress; HTTP listener on port 80 |
| RDS PostgreSQL 16 | `db.t4g.micro`, encrypted, 7-day backups, deletion protection |
| ElastiCache Redis 7 | `cache.t4g.micro`, TLS + AUTH token |
| SSM Parameters | `DATABASE_URL`, `REDIS_URL`, `GITHUB_WEBHOOK_SECRET`, `db-password` |
| IAM roles | Scoped ECS task + execution roles (SQS, ECS, SSM, CloudWatch) |
| Security groups | ALB → ECS tasks → RDS/Redis, no direct internet access |

### Plan and apply

```bash
cd infra/terraform

# Local plan (no real AWS needed)
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
terraform plan

# Apply against real AWS (requires valid credentials)
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
aws configure   # or set real env vars
terraform apply
```

### After apply — update SSM secrets

```bash
aws ssm put-parameter \
  --name "/shipnexus/production/database-url" \
  --value "postgres://shipnexus:<password>@<rds-endpoint>:5432/shipnexus_db" \
  --type SecureString --overwrite

aws ssm put-parameter \
  --name "/shipnexus/production/redis-url" \
  --value "rediss://:<auth-token>@<redis-endpoint>:6379" \
  --type SecureString --overwrite

aws ssm put-parameter \
  --name "/shipnexus/production/github-webhook-secret" \
  --value "<your-github-webhook-secret>" \
  --type SecureString --overwrite
```

---

## Connecting a Real GitHub Webhook

1. Go to your repository → **Settings** → **Webhooks** → **Add webhook**
2. Set **Payload URL** to `http://<alb_dns_name>/deployments`
3. Set **Content type** to `application/json`
4. Set **Secret** to match `GITHUB_WEBHOOK_SECRET` in SSM
5. Select **Just the push event**
6. Click **Add webhook** — GitHub will send a ping event to verify the endpoint

Once HTTPS is configured (ACM certificate + ALB HTTPS listener), update the Payload URL to `https://`.

---

## Running Tests

```bash
# API unit tests
cd apps/api && npm test

# Worker unit tests
cd apps/worker && npm test

# Worker e2e tests
cd apps/worker && npm run test:e2e
```

---

## Production Checklist

- [ ] Replace `terraform.tfvars` placeholder passwords with strong random values
- [ ] Update SSM parameters with real connection strings after `terraform apply`
- [ ] Set `ECS_DRY_RUN=false` and `ECS_SKIP_STABILITY_POLL=false` in worker task definition
- [ ] Add ACM certificate and HTTPS listener to the ALB
- [ ] Set `multi_az = true` on the RDS instance for high availability
- [ ] Enable `automatic_failover_enabled` on ElastiCache (requires 2+ nodes)
- [ ] Configure ECR repositories and push real images to replace `nginx:alpine`
- [ ] Set up GitHub Actions CI/CD to build, push, and call `aws ecs update-service`
- [ ] Enable S3 remote state backend in `providers.tf`
- [ ] Set `deletion_protection = true` and `enable_deletion_protection = true` on ALB (already set)
- [ ] Configure CloudWatch alarms on SQS `ApproximateNumberOfMessagesNotVisible` for stuck jobs
