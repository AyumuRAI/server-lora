#!/bin/bash
docker compose up -d


# Wait until primary is ready
until docker exec server-lora pg_isready -U admin; do
  echo "Waiting for primary..."
  sleep 2
done

# Reload or restart Postgres to apply changes from primary and replica docker init scripts
docker restart server-lora
docker restart server-lora-replica

echo "Postgres started"