#!/usr/bin/env bash
# exit on error
set -o errexit

# --- 1. Build Vue Frontend ---
echo "Building Vue Frontend..."
cd web-frontend
npm install
npm run build
cd ..

# --- 2. Setup Python Backend ---
echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "Build complete!"
