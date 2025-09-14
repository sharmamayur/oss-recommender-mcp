#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  updated_at: string;
  created_at: string;
  topics: string[];
  license?: {
    name: string;
  };
  size: number;
  forks_count: number;
  open_issues_count: number;
}

interface RecommendationContext {
  projectType?: string;
  language?: string;
  features?: string[];
  complexity?: "simple" | "medium" | "complex";
  license?: string;
}

class CursorOSSRecommender {
  private githubToken: string;
  private baseURL = "https://api.github.com";

  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || "";
    if (!this.githubToken) {
      console.warn(
        "Warning: GITHUB_TOKEN not set. API calls will be rate-limited."
      );
    }
  }

  private getHeaders() {
    return {
      Authorization: this.githubToken ? `token ${this.githubToken}` : "",
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "cursor-oss-recommender-mcp",
    };
  }

  async searchRepositories(
    query: string,
    sort: string = "stars",
    order: string = "desc"
  ): Promise<GitHubRepository[]> {
    try {
      const response = await axios.get(`${this.baseURL}/search/repositories`, {
        headers: this.getHeaders(),
        params: {
          q: query,
          sort,
          order,
          per_page: 20,
        },
      });
      return response.data.items;
    } catch (error) {
      console.error("Error searching repositories:", error);
      throw new Error("Failed to search repositories");
    }
  }

  async getRepositoryDetails(
    owner: string,
    repo: string
  ): Promise<GitHubRepository> {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching repository details:", error);
      throw new Error("Failed to fetch repository details");
    }
  }

  generateRecommendations(
    repos: GitHubRepository[],
    context: RecommendationContext
  ) {
    return repos
      .map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        lastUpdated: repo.updated_at,
        topics: repo.topics,
        license: repo.license?.name,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        size: repo.size,
        score: this.calculateScore(repo, context),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(
    repo: GitHubRepository,
    context: RecommendationContext
  ): number {
    let score = 0;

    // Base score from stars (logarithmic scale)
    score += Math.log10(repo.stargazers_count + 1) * 10;

    // Language match bonus
    if (context.language && repo.language === context.language) {
      score += 20;
    }

    // Recent activity bonus
    const daysSinceUpdate =
      (Date.now() - new Date(repo.updated_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 15;
    else if (daysSinceUpdate < 90) score += 10;
    else if (daysSinceUpdate < 365) score += 5;

    // License compatibility
    if (context.license && repo.license?.name === context.license) {
      score += 10;
    }

    // Health indicators
    const issueRatio =
      repo.open_issues_count / Math.max(repo.stargazers_count, 1);
    if (issueRatio < 0.1) score += 10;
    else if (issueRatio < 0.2) score += 5;

    // Size penalty for very large repos (might be too complex)
    if (context.complexity === "simple" && repo.size > 10000) {
      score -= 10;
    }

    return Math.round(score);
  }
}

const recommender = new CursorOSSRecommender();

// Define MCP tools
const tools: Tool[] = [
  {
    name: "search_oss_projects",
    description:
      "Search for open source projects on GitHub based on keywords and context",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for finding relevant projects",
        },
        language: {
          type: "string",
          description:
            'Programming language filter (e.g., "typescript", "python", "javascript")',
        },
        projectType: {
          type: "string",
          description:
            'Type of project (e.g., "library", "framework", "tool", "cli")',
        },
        features: {
          type: "array",
          items: { type: "string" },
          description: "Required features or keywords",
        },
        complexity: {
          type: "string",
          enum: ["simple", "medium", "complex"],
          description: "Desired complexity level",
        },
        license: {
          type: "string",
          description: 'Preferred license type (e.g., "MIT", "Apache-2.0")',
        },
        minStars: {
          type: "number",
          description: "Minimum number of stars",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_project_details",
    description: "Get detailed information about a specific GitHub repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (username or organization)",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "recommend_alternatives",
    description: "Find alternative projects to a given repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner",
        },
        repo: {
          type: "string",
          description: "Repository name",
        },
        limit: {
          type: "number",
          description: "Maximum number of alternatives to return (default: 10)",
        },
      },
      required: ["owner", "repo"],
    },
  },
];

// Create MCP server
const server = new Server({
  name: "oss-recommender",
  version: "1.0.0",
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_oss_projects": {
        const {
          query,
          language,
          projectType,
          features,
          complexity,
          license,
          minStars,
        } = args as any;

        // Build search query
        let searchQuery = query;
        if (language) searchQuery += ` language:${language}`;
        if (projectType) searchQuery += ` ${projectType}`;
        if (features && features.length > 0) {
          searchQuery += ` ${features.join(" ")}`;
        }
        if (minStars) searchQuery += ` stars:>=${minStars}`;

        const repos = await recommender.searchRepositories(searchQuery);

        // Filter by license if specified
        const filteredRepos = license
          ? repos.filter((repo) => repo.license?.name === license)
          : repos;

        const context: RecommendationContext = {
          language,
          projectType,
          features,
          complexity,
          license,
        };

        const recommendations = recommender.generateRecommendations(
          filteredRepos,
          context
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query: searchQuery,
                  totalFound: recommendations.length,
                  recommendations: recommendations.slice(0, 10), // Top 10
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_project_details": {
        const { owner, repo } = args as any;
        const details = await recommender.getRepositoryDetails(owner, repo);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  name: details.name,
                  fullName: details.full_name,
                  description: details.description,
                  url: details.html_url,
                  stars: details.stargazers_count,
                  language: details.language,
                  lastUpdated: details.updated_at,
                  createdAt: details.created_at,
                  topics: details.topics,
                  license: details.license?.name,
                  forks: details.forks_count,
                  issues: details.open_issues_count,
                  size: details.size,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "recommend_alternatives": {
        const { owner, repo, limit = 10 } = args as any;

        // Get the original repository details
        const originalRepo = await recommender.getRepositoryDetails(
          owner,
          repo
        );

        // Build search query based on the original repo
        let searchQuery = originalRepo.description || originalRepo.name;
        if (originalRepo.language)
          searchQuery += ` language:${originalRepo.language}`;
        if (originalRepo.topics && originalRepo.topics.length > 0) {
          searchQuery += ` ${originalRepo.topics.slice(0, 3).join(" ")}`;
        }

        const repos = await recommender.searchRepositories(searchQuery);

        // Filter out the original repo and similar ones
        const alternatives = repos
          .filter((r) => r.full_name !== originalRepo.full_name)
          .slice(0, limit);

        const context: RecommendationContext = {
          language: originalRepo.language,
          license: originalRepo.license?.name,
        };

        const recommendations = recommender.generateRecommendations(
          alternatives,
          context
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  originalRepo: {
                    name: originalRepo.name,
                    fullName: originalRepo.full_name,
                    url: originalRepo.html_url,
                  },
                  alternatives: recommendations.slice(0, limit),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OSS Recommender MCP server running on stdio");
}

main().catch(console.error);
