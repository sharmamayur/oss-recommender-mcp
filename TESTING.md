# Testing Guide for OSS Recommender MCP Server

This guide shows you how to test the MCP server in different ways to ensure it works correctly.

## Prerequisites

1. **GitHub Token**: Get a token from https://github.com/settings/tokens
2. **Node.js 18+**: Make sure you have Node.js installed
3. **Built Package**: Run `npm run build` first

## Test Methods

### 1. Direct MCP Server Test

Test the server by sending JSON-RPC requests directly:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token_here

# Start the server and send test requests
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
```

### 2. Test with MCP Client (Recommended)

Create a simple test client to interact with the server:

```bash
# Run the test client
node test-client.js
```

### 3. Test with Cursor

1. Install the package globally:
   ```bash
   npm install -g .
   ```

2. Add to Cursor configuration:
   ```json
   {
     "mcpServers": {
       "oss-recommender": {
         "command": "oss-recommender",
         "env": {
           "GITHUB_TOKEN": "your_github_token_here"
         }
       }
     }
   }
   ```

3. Restart Cursor and test the tools

### 4. Test with Claude Desktop

1. Install the package globally:
   ```bash
   npm install -g .
   ```

2. Add to Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "oss-recommender": {
         "command": "oss-recommender",
         "env": {
           "GITHUB_TOKEN": "your_github_token_here"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop and test the tools

## Test Scenarios

### Basic Functionality Tests

1. **List Tools**: Verify all 3 tools are available
2. **Search Projects**: Test searching for different types of projects
3. **Get Project Details**: Test getting details for a specific repository
4. **Find Alternatives**: Test finding alternatives to a known project

### Error Handling Tests

1. **Invalid GitHub Token**: Test with invalid/missing token
2. **Invalid Repository**: Test with non-existent repository
3. **Network Issues**: Test with network disconnected
4. **Rate Limiting**: Test with high request volume

### Performance Tests

1. **Response Time**: Measure response times for different queries
2. **Memory Usage**: Monitor memory usage during operation
3. **Concurrent Requests**: Test multiple simultaneous requests

## Expected Results

### Successful Tool List Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "search_oss_projects",
        "description": "Search for open source projects on GitHub...",
        "inputSchema": { ... }
      },
      {
        "name": "get_project_details",
        "description": "Get detailed information about a specific GitHub repository",
        "inputSchema": { ... }
      },
      {
        "name": "recommend_alternatives",
        "description": "Find alternative projects to a given repository",
        "inputSchema": { ... }
      }
    ]
  }
}
```

### Successful Search Response
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"query\": \"react library\",\n  \"totalFound\": 20,\n  \"recommendations\": [\n    {\n      \"name\": \"react\",\n      \"fullName\": \"facebook/react\",\n      \"description\": \"A declarative, efficient, and flexible JavaScript library...\",\n      \"url\": \"https://github.com/facebook/react\",\n      \"stars\": 220000,\n      \"language\": \"JavaScript\",\n      \"score\": 95\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

1. **"GITHUB_TOKEN not set"**: Set the environment variable
2. **"Failed to search repositories"**: Check GitHub token permissions
3. **"Unknown tool"**: Verify tool names in requests
4. **Connection refused**: Make sure the server is running

### Debug Mode

Run with debug logging:
```bash
DEBUG=* node dist/index.js
```

### Check Logs

Look for error messages in stderr:
```bash
node dist/index.js 2> error.log
```
