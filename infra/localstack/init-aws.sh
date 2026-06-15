#!/bin/bash
echo ">>> Initializing LocalStack resources..."

awslocal sqs create-queue \
  --queue-name shipnexus-deployments.fifo \
  --attributes '{
    "FifoQueue": "true",
    "ContentBasedDeduplication": "true"
  }'

echo ">>> SQS queue created."
