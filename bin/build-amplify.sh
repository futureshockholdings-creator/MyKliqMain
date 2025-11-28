#!/bin/bash
set -e

echo "🏗️ MyKliq AWS Amplify Build"
echo "============================"

# Set production environment
export NODE_ENV=production

# Build the React frontend with Vite
echo "📦 Building React frontend..."
npx vite build

# Build the Express server with esbuild
echo "🔧 Building Express server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify

echo "✅ Build complete!"
