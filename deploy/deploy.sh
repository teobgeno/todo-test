#!/bin/bash
set -e

cd /home/ec2-user/app

echo "=== Logging in to ECR ==="
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 958085379190.dkr.ecr.us-east-1.amazonaws.com

echo "=== Pulling latest images ==="
docker compose -f docker-compose.prod.yml pull backend frontend

echo "=== Running database migrations ==="
if ! docker compose -f docker-compose.prod.yml run --rm backend npm run migration:run:prod; then
  echo "MIGRATION FAILED — aborting deploy, leaving existing containers untouched."
  exit 1
fi

echo "=== Restarting services with new images ==="
docker compose -f docker-compose.prod.yml up -d backend frontend nginx

echo "=== Waiting for backend to become healthy ==="
sleep 5
if ! curl -sf http://localhost:3000/health > /dev/null; then
  echo "WARNING: backend did not respond healthy after restart. Check manually: docker compose logs backend"
  exit 1
fi

echo "=== Cleaning up old images ==="
docker image prune -f

echo "=== Deploy complete ==="