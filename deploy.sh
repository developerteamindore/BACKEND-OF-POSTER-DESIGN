#!/bin/bash

# Deployment script for poster-editing-backend
set -e

# Configuration
IMAGE_NAME="poster-editing-backend"
CONTAINER_NAME="poster-editing-backend"
PORT=3001
ENV_FILE="/opt/poster-design/.env"
BRANCH_NAME="deployment-branch"

echo "=== Pulling latest changes from $BRANCH_NAME ==="
git checkout $BRANCH_NAME
git pull origin $BRANCH_NAME

echo "=== Building Docker image ==="
docker build -t $IMAGE_NAME .

echo "=== Checking env file exists ==="
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: Env file not found at $ENV_FILE"
    exit 1
fi

echo "=== Stopping and removing existing container (if exists) ==="
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

echo "=== Running new container ==="
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:3001 \
    --env-file "$ENV_FILE" \
    $IMAGE_NAME

echo "=== Deployment successful ==="
echo "Container is running on port $PORT"
echo "Check logs with: docker logs -f $CONTAINER_NAME"