# OSS Recommender MCP Server

An MCP (Model Context Protocol) server that helps AI coding assistants recommend relevant open source projects instead of writing custom code from scratch. Works with Cursor, Claude Desktop, and other MCP-compatible AI tools.

## Features

- **Smart Project Search**: Search GitHub repositories with intelligent filtering
- **Context-Aware Recommendations**: Get recommendations based on project type, language, complexity, and features
- **Project Analysis**: Detailed repository information including stars, activity, license, and health metrics
- **Alternative Discovery**: Find alternative projects to existing ones
- **Scoring Algorithm**: Intelligent scoring based on popularity, activity, and relevance
- **Universal Compatibility**: Works with any AI coding assistant that supports MCP

## Supported AI Tools

This MCP server is compatible with:
- **Cursor** - AI-powered code editor
- **Claude Desktop** - Anthropic's desktop AI assistant
- **Any MCP-compatible AI tool** - Any coding assistant that supports the Model Context Protocol

The server helps these AI tools recommend existing open source solutions instead of writing custom code from scratch.

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g oss-recommender-mcp
```

### Option 2: Install locally

```bash
npm install oss-recommender-mcp
```

### Option 3: Install from source

1. Clone this repository:
```bash
git clone <repository-url>
cd oss-recommender-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run the server:
```bash
npm start
```

## Configuration

### GitHub Token

Get a GitHub personal access token from https://github.com/settings/tokens with the following permissions:
- `public_repo` (for public repository access)
- `read:user` (for user information)

Set the environment variable:
```bash
export GITHUB_TOKEN=your_github_token_here
```

Or create a `.env` file:
```
GITHUB_TOKEN=your_github_token_here
```

### AI Tool Integration

This MCP server works with any AI coding assistant that supports MCP (Model Context Protocol). Here are configuration examples for popular tools:

#### Cursor

Add to your Cursor configuration:

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

#### Claude Desktop

Add to your Claude Desktop configuration:

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

#### Other MCP-Compatible Tools

For any other AI tool that supports MCP:

```json
{
  "mcpServers": {
    "oss-recommender": {
      "command": "npx",
      "args": ["oss-recommender"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## Usage

### Available Tools

#### 1. `search_oss_projects`
Search for open source projects with intelligent filtering.

**Parameters:**
- `query` (required): Search query
- `language`: Programming language filter
- `projectType`: Type of project (library, framework, tool, cli)
- `features`: Array of required features
- `complexity`: Desired complexity (simple, medium, complex)
- `license`: Preferred license type
- `minStars`: Minimum number of stars

**Example:**
```
Search for TypeScript libraries for data visualization with at least 1000 stars
```

#### 2. `get_project_details`
Get detailed information about a specific repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name

**Example:**
```
Get details for microsoft/vscode
```

#### 3. `recommend_alternatives`
Find alternative projects to an existing one.

**Parameters:**
- `owner` (required): Original repository owner
- `repo` (required): Original repository name
- `limit`: Maximum alternatives to return (default: 10)

**Example:**
```
Find alternatives to expressjs/express
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## Scoring Algorithm

The recommendation scoring considers:

- **Popularity**: Logarithmic scale based on stars
- **Language Match**: Bonus for matching programming language
- **Recent Activity**: Higher score for recently updated projects
- **License Compatibility**: Bonus for matching preferred license
- **Health Metrics**: Penalty for high issue-to-star ratio
- **Complexity**: Size-based penalties for simple use cases

## Examples

### Finding a React Component Library
```
Search for React component libraries with TypeScript support, MIT license, and at least 5000 stars
```

### Finding CLI Tools
```
Search for Python CLI tools for file processing with simple complexity
```

### Finding Alternatives
```
Find alternatives to lodash/lodash for JavaScript utilities
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

GNU Affero General Public License v3.0 - see LICENSE file for details
