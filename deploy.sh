#!/bin/bash

# Deployment script for poster-editing-backend
set -e

# Configuration
IMAGE_NAME="poster-editing-backend"
CONTAINER_NAME="poster-editing-backend"
PORT=3001

echo "=== Building Docker image ==="
docker build -t $IMAGE_NAME .

echo "=== Stopping and removing existing container (if exists) ==="
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

echo "=== Running new container ==="
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:3001 \
    --env-file .env.local \
    $IMAGE_NAME

echo "=== Deployment successful ==="
echo "Container is running on port $PORT"
echo "Check logs with: docker logs -f $CONTAINER_NAME"
