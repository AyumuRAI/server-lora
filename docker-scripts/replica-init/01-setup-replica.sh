#!/bin/bash
set -e

echo "[Replica Init] Waiting for primary to be ready..."
until pg_isready -h postgres-primary -p 5432 -U admin; do
  echo "  Primary not ready yet, retrying in 2s..."
  sleep 2
done

# Only run base backup if standby.signal does NOT exist
if [ ! -f /var/lib/postgresql/data/standby.signal ]; then
  echo "[Replica Init] Replica not initialized yet. Taking base backup from primary..."
  rm -rf /var/lib/postgresql/data/*   # wipe old data just in case
  pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U admin -Fp -Xs -P -R
  echo "[Replica Init] Base backup complete, replica initialized."
else
  echo "[Replica Init] Replica already initialized. Skipping base backup."
fi