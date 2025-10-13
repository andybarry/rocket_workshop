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

# Sync to remote server
echo "Syncing to remote server..."
rsync -avz --delete deploy-package/ "$REMOTE_SERVER:$REMOTE_REPO_DIR/" || error_exit "Rsync failed."

# Clean up local deployment package
rm -rf deploy-package

# Run npm install and service management on remote server
echo "Installing dependencies and restarting service on remote server..."
ssh "$REMOTE_SERVER" << EOF
  cd $REMOTE_REPO_DIR
  npm install || { echo "npm install failed"; exit 1; }
#  sudo -n ln -sf $REMOTE_REPO_DIR/feedback.service /etc/systemd/system/ || { echo "Failed to link service file"; exit 1; }
#  sudo -n systemctl daemon-reload || { echo "Failed to reload systemd"; exit 1; }
#  sudo -n systemctl restart feedback.service || { echo "Failed to restart service"; exit 1; }
EOF

echo "sudo -n ln -sf $REMOTE_REPO_DIR/feedback.service /etc/systemd/system/ || { echo \"Failed to link service file\"; exit 1; }"
echo "sudo -n systemctl daemon-reload || { echo \"Failed to reload systemd\"; exit 1; }"
echo "sudo -n systemctl restart feedback.service || { echo \"Failed to restart service\"; exit 1; }"

echo "Deployment complete."
