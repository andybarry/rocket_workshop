#!/bin/bash
set -euo pipefail

# Function to output an error message and exit.
error_exit() {
  echo "ERROR: $1" >&2
  exit 1
}

# Variables
REMOTE_SERVER="ai.stageoneeducation.com"
REMOTE_REPO_DIR="/home/abarry/feedback"
BUILD_DIR="dist"
BACKEND_FILES="server.js database scripts package.json package-lock.json"
SERVICE_FILES="ecosystem.config.cjs feedback.service"

# Timestamp shared by every backup created during this run (YYYYMMDD-HHMMSS).
BACKUP_TS="$(date +%Y%m%d-%H%M%S)"
LOCAL_DB="database/feedback.db"
LOCAL_BACKUP_DIR="database/backups"
REMOTE_DB_NEW="/var/lib/feedback/feedback.db"
REMOTE_DB_OLD="$REMOTE_REPO_DIR/database/feedback.db"

# Back up the live database on the remote server before deploying. The live
# file may already be outside the repo, or still at the old path until the
# next process start migrates it. Fail if neither file exists.
echo "Backing up remote database..."
ssh "$REMOTE_SERVER" "TS='$BACKUP_TS' NEW='$REMOTE_DB_NEW' OLD='$REMOTE_DB_OLD' bash -s" << 'EOF' || error_exit "Remote database backup failed."
  set -euo pipefail
  DIR="$HOME/feedback-backups"
  if [ -f "$NEW" ]; then
    DB="$NEW"
  elif [ -f "$OLD" ]; then
    DB="$OLD"
  else
    echo "No live database found at $NEW or $OLD. Refusing to deploy."
    exit 1
  fi
  mkdir -p "$DIR"
  DEST="$DIR/feedback-$TS.db"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB" ".backup '$DEST'"
  else
    cp "$DB" "$DEST"
    [ -f "$DB-wal" ] && cp "$DB-wal" "$DEST-wal"
    [ -f "$DB-shm" ] && cp "$DB-shm" "$DEST-shm"
  fi
  echo "Remote backup created: $DEST"
EOF

# Back up the local database with the same timestamp.
echo "Backing up local database..."
if [ -f "$LOCAL_DB" ]; then
  mkdir -p "$LOCAL_BACKUP_DIR"
  LOCAL_DEST="$LOCAL_BACKUP_DIR/feedback-$BACKUP_TS.db"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$LOCAL_DB" ".backup '$LOCAL_DEST'" || error_exit "Local database backup failed."
  else
    cp "$LOCAL_DB" "$LOCAL_DEST" || error_exit "Local database backup failed."
    [ -f "$LOCAL_DB-wal" ] && cp "$LOCAL_DB-wal" "$LOCAL_DEST-wal"
    [ -f "$LOCAL_DB-shm" ] && cp "$LOCAL_DB-shm" "$LOCAL_DEST-shm"
  fi
  echo "Local backup created: $LOCAL_DEST"
else
  echo "No local database found at $LOCAL_DB, skipping local backup."
fi

echo "Building feedback application..."

# Install dependencies
npm install || error_exit "npm install failed."

# Build the frontend
npm run build || error_exit "npm run build failed."

# Create deployment package
echo "Creating deployment package..."
mkdir -p deploy-package
cp -r $BUILD_DIR deploy-package/
cp -r $BACKEND_FILES deploy-package/
cp -r database deploy-package/
cp -r $SERVICE_FILES deploy-package/

# Never ship a database. The live file stays on the server, outside this package.
rm -f deploy-package/database/feedback.db \
  deploy-package/database/feedback.db-wal \
  deploy-package/database/feedback.db-shm
rm -rf deploy-package/database/backups

# Sync to remote server
# IMPORTANT: never overwrite or delete the live SQLite database. The --exclude
# rules protect the remote feedback.db* files from both being replaced by the
# local copy and from being removed by --delete.
echo "Syncing to remote server..."
rsync -avz --delete \
  --exclude 'database/feedback.db' \
  --exclude 'database/feedback.db-shm' \
  --exclude 'database/feedback.db-wal' \
  --exclude 'database/backups' \
  deploy-package/ "$REMOTE_SERVER:$REMOTE_REPO_DIR/" || error_exit "Rsync failed."

# Clean up local deployment package
rm -rf deploy-package

# Run npm install and service management on remote server
echo "Installing dependencies and restarting service on remote server..."
ssh "$REMOTE_SERVER" << EOF
  cd $REMOTE_REPO_DIR
  if [ ! -f "$REMOTE_DB_NEW" ] && [ ! -f "$REMOTE_DB_OLD" ]; then
    echo "Live database missing after deploy. Refusing to continue."
    exit 1
  fi
  npm install || { echo "npm install failed"; exit 1; }
#  sudo -n ln -sf $REMOTE_REPO_DIR/feedback.service /etc/systemd/system/ || { echo "Failed to link service file"; exit 1; }
#  sudo -n systemctl daemon-reload || { echo "Failed to reload systemd"; exit 1; }
#  sudo -n systemctl restart feedback.service || { echo "Failed to restart service"; exit 1; }
EOF

echo "sudo ln -sf $REMOTE_REPO_DIR/feedback.service /etc/systemd/system/ || { echo \"Failed to link service file\"; }"
echo "sudo systemctl daemon-reload || { echo \"Failed to reload systemd\"; }"
echo "sudo systemctl restart feedback.service || { echo \"Failed to restart service\"; }"

echo "Deployment complete."
