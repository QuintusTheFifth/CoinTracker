#!/bin/bash
# Deploy CoinTracker to Firebase Hosting
# Usage: ./deploy.sh

set -e

echo "🔧 Building..."
source ~/.nvm/nvm.sh 2>/dev/null || true
nvm use 16 2>/dev/null || true
ng build --prod

echo "📦 Copying to prod..."
rm -rf prod && cp -r dist/coinTracker prod

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Done! https://cointracker-26919.web.app"
