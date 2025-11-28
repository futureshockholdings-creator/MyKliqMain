#!/bin/bash
set -e

echo "🚀 MyKliq AWS Amplify Post-Build Setup"
echo "======================================="

# Clean up any existing amplify-hosting directory
rm -rf ./.amplify-hosting

# Create the required directory structure
echo "📁 Creating Amplify hosting directory structure..."
mkdir -p ./.amplify-hosting/compute/default
mkdir -p ./.amplify-hosting/static

# Copy the compiled server code to compute directory
echo "📦 Copying server code to compute directory..."
cp ./dist/index.js ./.amplify-hosting/compute/default/index.js

# Copy shared schema and types (needed at runtime)
echo "📋 Copying shared modules..."
mkdir -p ./.amplify-hosting/compute/default/shared
cp -r ./shared/* ./.amplify-hosting/compute/default/shared/ 2>/dev/null || true

# Copy server directory for any runtime dependencies
echo "📋 Copying server utilities..."
mkdir -p ./.amplify-hosting/compute/default/server
cp -r ./server/*.json ./.amplify-hosting/compute/default/server/ 2>/dev/null || true

# Install production-only dependencies in a clean directory
echo "📚 Installing production dependencies only..."
mkdir -p ./.amplify-hosting/compute/default/temp
cp ./package.json ./.amplify-hosting/compute/default/temp/
cp ./package-lock.json ./.amplify-hosting/compute/default/temp/ 2>/dev/null || true

cd ./.amplify-hosting/compute/default/temp
npm ci --omit=dev --legacy-peer-deps 2>/dev/null || npm install --omit=dev --legacy-peer-deps
mv node_modules ../node_modules
cd -

# Clean up temp directory
rm -rf ./.amplify-hosting/compute/default/temp

# Remove unnecessary large packages that aren't needed at runtime
echo "🧹 Removing unnecessary packages..."
rm -rf ./.amplify-hosting/compute/default/node_modules/@replit 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/typescript 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/@types 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/esbuild 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/@vitejs 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/vite 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/drizzle-kit 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/tailwindcss 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/postcss 2>/dev/null || true
rm -rf ./.amplify-hosting/compute/default/node_modules/autoprefixer 2>/dev/null || true

# Copy the built frontend static files
echo "🎨 Copying static frontend assets..."
cp -r ./dist/public/* ./.amplify-hosting/static/

# Copy additional static assets
echo "📄 Copying additional static files..."
cp ./favicon.ico ./.amplify-hosting/static/ 2>/dev/null || true
cp ./favicon.png ./.amplify-hosting/static/ 2>/dev/null || true

# Copy the deployment manifest
echo "📝 Copying deployment manifest..."
cp ./deploy-manifest.json ./.amplify-hosting/deploy-manifest.json

# Create a package.json for the compute function (ESM support)
echo "📦 Creating compute package.json..."
cat > ./.amplify-hosting/compute/default/package.json << 'EOF'
{
  "name": "mykliq-server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}
EOF

# Display directory size
echo ""
echo "📊 Build Summary:"
echo "=================="
du -sh ./.amplify-hosting/compute/default/
du -sh ./.amplify-hosting/static/
du -sh ./.amplify-hosting/

# Check if within Amplify limits (220MB compressed)
COMPUTE_SIZE=$(du -sm ./.amplify-hosting/compute/default/ | cut -f1)
echo ""
echo "📏 Compute size: ${COMPUTE_SIZE}MB"
if [ "$COMPUTE_SIZE" -gt 500 ]; then
    echo "⚠️  Warning: Compute directory is large. Consider further optimization."
else
    echo "✅ Size is within acceptable limits for AWS Amplify."
fi

echo ""
echo "✅ Post-build complete! Ready for AWS Amplify deployment."
