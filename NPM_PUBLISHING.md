# Publishing to npmjs - Complete Guide

This guide walks you through publishing the OSS Recommender MCP server to npmjs.

## Prerequisites

### 1. Create npm Account
1. Go to https://www.npmjs.com/
2. Click "Sign Up"
3. Choose a username (this will be your package scope)
4. Verify your email

### 2. Install npm CLI (if not already installed)
```bash
npm install -g npm@latest
```

### 3. Login to npm
```bash
npm login
```
Enter your username, password, and email when prompted.

## Pre-Publishing Checklist

### 1. Update Package Information
Make sure to update these fields in `package.json`:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/oss-recommender-mcp.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/oss-recommender-mcp/issues"
  },
  "homepage": "https://github.com/yourusername/oss-recommender-mcp#readme"
}
```

### 2. Check Package Name Availability
```bash
npm view oss-recommender-mcp
```
If it returns "404 Not Found", the name is available. If it exists, you'll need to choose a different name.

### 3. Test Package Locally
```bash
# Build the package
npm run build

# Test the package
npm test

# Create a tarball to test
npm pack

# Install globally to test
npm install -g ./oss-recommender-mcp-1.0.0.tgz

# Test the CLI
oss-recommender --help

# Clean up
rm oss-recommender-mcp-1.0.0.tgz
npm uninstall -g oss-recommender-mcp
```

## Publishing Steps

### 1. Final Build
```bash
npm run build
```

### 2. Check Package Contents
```bash
npm pack --dry-run
```
This shows what will be included in the package without creating the tarball.

### 3. Publish to npm
```bash
npm publish
```

### 4. Verify Publication
```bash
# Check your package on npm
npm view oss-recommender-mcp

# Test installation
npm install -g oss-recommender-mcp

# Test the CLI
oss-recommender --help
```

## Post-Publishing

### 1. Create GitHub Release
1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `OSS Recommender MCP Server v1.0.0`
5. Add release notes
6. Publish release

### 2. Update Documentation
- Update README with npm installation instructions
- Add badges to README
- Update any hardcoded URLs

### 3. Test Installation
```bash
# Test global installation
npm install -g oss-recommender-mcp
oss-recommender

# Test local installation
npm install oss-recommender-mcp
npx oss-recommender-mcp
```

## Updating the Package

### 1. Update Version
```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.0 → 1.1.0)
npm version minor

# Major version (1.0.0 → 2.0.0)
npm version major
```

### 2. Publish Update
```bash
npm publish
```

## Troubleshooting

### Common Issues

1. **Package name already exists**
   ```bash
   # Check if name exists
   npm view your-package-name
   
   # Use scoped package
   npm init --scope=@yourusername
   ```

2. **Permission denied**
   ```bash
   # Check if logged in
   npm whoami
   
   # Login again
   npm login
   ```

3. **Version already exists**
   ```bash
   # Update version
   npm version patch
   npm publish
   ```

4. **Build errors**
   ```bash
   # Fix TypeScript errors
   npm run build
   
   # Check for linting errors
   npm run lint
   ```

### Useful Commands

```bash
# Check package info
npm view oss-recommender-mcp

# Check package size
npm pack --dry-run

# Unpublish (within 24 hours)
npm unpublish oss-recommender-mcp@1.0.0

# Check who's logged in
npm whoami

# Logout
npm logout
```

## Package Information

- **Package Name**: `oss-recommender-mcp`
- **Version**: `1.0.0`
- **Size**: ~8.8 kB
- **Files**: 11 files (dist/, README.md, LICENSE, package.json)
- **Dependencies**: 3 runtime dependencies
- **Node Version**: >=18.0.0

## Success Checklist

- [ ] npm account created
- [ ] Package name available
- [ ] Package.json updated with correct info
- [ ] Package builds successfully
- [ ] Tests pass
- [ ] Package tested locally
- [ ] Published to npm
- [ ] Installation verified
- [ ] GitHub release created
- [ ] Documentation updated
