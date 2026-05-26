#!/usr/bin/env bash
set -euo pipefail

# Database backup script — dumps Neon PostgreSQL to a timestamped file.
# Usage:  ./scripts/backup.sh
# Requires: pg_dump, DATABASE_URL in .env.local or environment

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

# Load DATABASE_URL from .env.local if not already set
if [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_DIR/.env.local" ]; then
  DATABASE_URL=$(grep '^DATABASE_URL=' "$PROJECT_DIR/.env.local" | sed 's/^DATABASE_URL=//' | tr -d '"')
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="$BACKUP_DIR/moneytracker_${TIMESTAMP}.sql.gz"

echo "Backing up database..."
pg_dump "$DATABASE_URL" | gzip > "$FILENAME"

echo "Backup saved to $FILENAME ($(du -h "$FILENAME" | cut -f1))"

# Keep only the last 10 backups
cd "$BACKUP_DIR"
ls -t moneytracker_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm
echo "Cleanup done — keeping last 10 backups."
