#!/bin/bash

set -e

APP_DIR="/home/ubuntu/reconnect-app"
IMAGE_TAG="$1"
CONTAINER_NAME="reconnect-api"

if [ -z "$IMAGE_TAG" ]; then
    echo "ERROR: Image tag is required."
    echo "Usage: ./rollback.sh <image-tag>"
    echo "Example: ./rollback.sh a6561cf"
    exit 1
fi

echo "========================================="
echo "Reconnect Application Rollback"
echo "========================================="

echo "Rollback target: $IMAGE_TAG"

cd "$APP_DIR"

echo "Pulling Docker image..."

IMAGE_TAG="$IMAGE_TAG" docker compose \
    -f docker-compose.yml \
    pull api

echo "Starting application..."

IMAGE_TAG="$IMAGE_TAG" docker compose \
    -f docker-compose.yml \
    up -d

echo "Waiting for API container to become healthy..."

MAX_ATTEMPTS=12
ATTEMPT=1

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do

    STATUS=$(docker inspect \
        --format='{{.State.Health.Status}}' \
        "$CONTAINER_NAME" 2>/dev/null || echo "missing")

    echo "Health check $ATTEMPT/$MAX_ATTEMPTS: $STATUS"

    if [ "$STATUS" = "healthy" ]; then
        echo "API container is healthy!"
        break
    fi

    if [ "$STATUS" = "unhealthy" ]; then
        echo "ERROR: API container is unhealthy."
        docker compose ps
        exit 1
    fi

    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ "$STATUS" != "healthy" ]; then
    echo "ERROR: API did not become healthy within the expected time."
    docker compose ps
    exit 1
fi

echo "Checking final container status..."

docker compose ps

echo "========================================="
echo "Rollback completed successfully!"
echo "Rollback image: $IMAGE_TAG"
echo "========================================="
