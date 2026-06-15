# ShipNexus Worker

## Description

An SQS polling worker that pulls deployment jobs from AWS SQS, acquires
per-job Redis distributed locks to guarantee single-instance processing,
drives deterministic job state transitions (pending to queued to running to
success/failed), and persists all state changes to PostgreSQL as part of
the ShipNexus deployment pipeline.

## Environment setup

| Variable                 | Example                                            | Notes                                                                 |
|--------------------------|----------------------------------------------------|-----------------------------------------------------------------------|
| DATABASE_URL             | postgres://user:pass@localhost:5433/shipnexus_db   | Postgres connection string                                            |
| REDIS_URL                | redis://:pass@localhost:6380                       | Redis connection string                                               |
| AWS_ENDPOINT_URL         | http://localhost:4567                              | LocalStack endpoint; omit in production                               |
| AWS_REGION               | us-east-1                                          |                                                                       |
| AWS_ACCESS_KEY_ID        | test                                               | Use real credentials in production                                    |
| AWS_SECRET_ACCESS_KEY    | test                                               |                                                                       |
| SQS_QUEUE_NAME           | shipnexus-deployments.fifo                         | Must match the queue created in LocalStack or AWS                     |
| SQS_VISIBILITY_TIMEOUT   | 30                                                 | Seconds. Must exceed expected job processing time. Redis lock TTL is derived from this value plus a safety margin. |
| SQS_WAIT_TIME_SECONDS    | 20                                                 | Long-poll duration. Reduces empty-receive API calls; max is 20.       |

## Worker behavior

Each SQS message carries only a jobId (Claim Check pattern). The worker
resolves the full job from Postgres, then drives it through these states:

  pending -> queued -> running -> success
                              -> failed

- queued: job acknowledged from SQS, lock acquired, record fetched
- running: processing started (startedAt stamped)
- success: ECS/SDK calls complete; SQS message deleted; lock released
- failed: unrecoverable error; errorMessage written; SQS message NOT
  deleted so it reappears after VisibilityTimeout for retry

On failure the message becomes visible again after SQS_VISIBILITY_TIMEOUT
seconds. Monitor failed rows in Postgres and the SQS
ApproximateNumberOfMessagesNotVisible CloudWatch metric to catch stuck jobs.

## Running

npm run start:dev

## Test

npm run test
npm run test:e2e
