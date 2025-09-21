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
BACKEND_FILES="server.prod.js database scripts package.json package-lock.json"
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
rsync -avz deploy-package/ "$REMOTE_SERVER:$REMOTE_REPO_DIR/" || error_exit "Rsync failed."

# Clean up local deployment package
rm -rf deploy-package

echo "Deployment complete."
echo "SSH into $REMOTE_SERVER and run:"
echo "  cd $REMOTE_REPO_DIR"
echo "  npm install"
echo "  sudo ln -sf $REMOTE_REPO_DIR/feedback.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl restart feedback.service"
