# 🚀 ShipNexus

ShipNexus is an enterprise-grade, event-driven distributed deployment pipeline architecture. It receives GitHub webhook events, secures them via cryptographic verification, queues them safely using the Claim Check pattern, and processes them asynchronously via a resilient standalone worker service—all monitored in real time through a Next.js dashboard.

The project also includes a complete production-grade Infrastructure as Code (IaC) layer using Terraform.

---

## 🏗️ Architecture Overview

The system is engineered for zero-trust security, high availability, and strict eventual consistency:

1. **Zero-Trust Ingress:** Public webhooks are secured using HMAC SHA-256 signature verification with constant-time cryptographic comparison (`timingSafeEqual`) to guarantee payloads originate strictly from GitHub.
2. **Event-Driven Decoupling (Claim Check Pattern):** The NestJS API validates payloads, writes the initial state to PostgreSQL, and publishes a lightweight "Claim Check" (the `jobId` only) to an AWS SQS FIFO queue. This keeps the message broker fast and lightweight.
3. **Idempotency & Message Ordering:** SQS FIFO ensures strict per-service execution ordering. Deduping guards prevent duplicate processing, while Redis distributed locks guarantee that exactly one worker instance can manipulate a job state at any given moment.
4. **Resilient Worker State Machine:** A standalone background worker polls SQS, claims the lock, and moves the deployment through its lifecycle (`pending` -> `queued` -> `running` -> `success`/`failed`). Every single state transition is guarded by strict SQL database row-affected checks to prevent race conditions.
5. **Cloud-Native Muscle:** The worker integrates natively with the AWS SDK v3 to trigger real-time Amazon ECS Fargate service deployments, featuring built-in transient API error handling and stability polling alongside a local `DRY_RUN` seam.
6. **Direct-Read Live Dashboard:** A Next.js (App Router) frontend leverages React Server Components to connect directly to the database layer for high-performance, real-time job monitoring with automatic refresh capabilities.

---

## 💻 Tech Stack

* **Backend Ingress API:** NestJS
* **Background Processing Worker:** Node.js / NestJS Standalone Application
* **Frontend Dashboard:** Next.js (App Router), Tailwind CSS
* **Database & ORM:** PostgreSQL + Drizzle ORM (with Drizzle Studio support)
* **Caching & Distributed Locking:** Redis
* **Message Broker:** AWS SQS FIFO (Mocked locally via LocalStack)
* **Infrastructure as Code:** Terraform (AWS Provider)
* **Local Containerization:** Docker Compose

---

## 📁 Project Structure

This repository is structured as a clean, unified monorepo:

```text
ShipNexus/
├── apps/
│   ├── api/            # NestJS API (Webhook ingress, HMAC verification, SQS publisher)
│   ├── worker/         # Standalone SQS consumer, Redis locker, and ECS deployment manager
│   └── web/            # Next.js Dashboard (RSC direct-read engine)
├── infra/
│   └── terraform/      # AWS Production Infrastructure (VPC, SQS FIFO, ECS Cluster, IAM, RDS, Redis)
├── docker-compose.yml  # Local infrastructure suite (Postgres, Redis, LocalStack)
├── package.json
└── README.md
```

🚀 Getting Started (Local Development)
1. Launch Local Infrastructure
Ensure Docker is running on your machine, then spin up your local stateful services from the project root:
```text
Bash
docker-compose up -d
```
This instantly provisions local instances of PostgreSQL, Redis, and LocalStack (mocking AWS SQS).

2. Prepare the Database Schema
Navigate to the API application directory to install dependencies and push migrations:
```text
Bash
cd apps/api
npm install
npm run db:push
```
3. Initialize Environment Files
Create a .env file in apps/api/, apps/worker/, and apps/web/ based on their respective .env.example configurations.

Add these local evaluation bypass flags to your apps/worker/.env file to skip live cloud provisioning steps during local testing:
```text
Code snippet
ECS_DRY_RUN=true
ECS_SKIP_STABILITY_POLL=true
```
4. Run the Pipeline Concurrent Services
Open three separate terminal windows at the project root directory to launch the application stack concurrently:

Terminal 1 (Ingress API):
```text
Bash
cd apps/api && npm run start:dev
```
Terminal 2 (Async Worker):
```text
Bash
cd apps/worker && npm run start:dev
```
Terminal 3 (Live Dashboard):
```text
Bash
cd apps/web && npm run dev
```
Open http://localhost:3000 to view your live, auto-refreshing deployment stream.

🛠️ Infrastructure as Code (Terraform)
The infra/terraform directory contains production-grade infrastructure configurations matching the exact operational needs of this decoupled deployment pipeline.

Provisioned AWS Architecture Components:
Custom VPC: Network blueprint allocating public and private subnets across multiple Availability Zones, backed by dual NAT Gateways for redundant, outbound public internet access from isolated private workloads.

SQS FIFO Backbone: A dedicated .fifo queue utilizing content-based deduplication, complete with a structured Dead Letter Queue (DLQ) and a 3-strike execution max-receive retry policy.

ECS Cluster Core: An Amazon ECS Cluster leveraging fully managed FARGATE and cost-efficient FARGATE_SPOT capacity providers with Container Insights actively configured for metric observability.

Stateful Data Layer: Amazon RDS PostgreSQL and Amazon ElastiCache Redis clusters completely isolated within non-routable private subnets.

Fine-Grained IAM & Security: Least-privilege IAM Execution and Task Roles explicitly scoped down to necessary SQS, CloudWatch, and SSM access paths. All access to databases is dynamic, managed via target application cluster Security Groups.

Inspecting the Infrastructure:
To initialize and inspect the production-ready infrastructure map:
```text
Bash
cd infra/terraform
terraform init
terraform plan
```
🔐 Security Commitments
HMAC Signatures: All webhook integrations validate signatures against a cryptographically secure GITHUB_WEBHOOK_SECRET configuration using zero-leak byte comparison.

Data Isolation: State storage engines (RDS and ElastiCache) are isolated inside non-routable private subnets. Communication pathways are dynamically locked down using strict AWS Security Groups allowing traffic only from targeted application cluster tasks.

Zero-Leak Commit Hygiene: The root repository utilizes an explicitly hardened .gitignore mechanism keeping local environment state, credential stores, and bulky system provider binaries (.terraform/) completely isolated from your cloud code history.
