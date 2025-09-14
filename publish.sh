#!/bin/bash

echo "🚀 Publishing OSS Recommender MCP Server to npmjs"
echo "================================================="

# Check if logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

echo "✅ Logged in as: $(npm whoami)"

# Check if package name is available
echo "🔍 Checking if package name is available..."
if npm view oss-recommender-mcp > /dev/null 2>&1; then
    echo "❌ Package name 'oss-recommender-mcp' already exists!"
    echo "   Please choose a different name or use a scoped package."
    exit 1
fi

echo "✅ Package name is available"

# Build the package
echo "🔨 Building package..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"

# Run tests
echo "🧪 Running tests..."
node test-client.js

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

echo "✅ Tests passed"

# Check package contents
echo "📦 Package contents:"
npm pack --dry-run

# Ask for confirmation
echo ""
read -p "🤔 Ready to publish? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

# Publish to npm
echo "📤 Publishing to npmjs..."
npm publish

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Successfully published oss-recommender-mcp@1.0.0!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test installation: npm install -g oss-recommender-mcp"
    echo "2. Test CLI: oss-recommender --help"
    echo "3. Create GitHub release"
    echo "4. Update documentation"
    echo ""
    echo "🔗 Package URL: https://www.npmjs.com/package/oss-recommender-mcp"
else
    echo "❌ Publishing failed!"
    exit 1
fi
