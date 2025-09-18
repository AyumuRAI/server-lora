#!/bin/bash
set -e

echo "[Primary Init] Configuring replication for admin..."
echo "host replication admin all trust" >> /var/lib/postgresql/data/pg_hba.conf
