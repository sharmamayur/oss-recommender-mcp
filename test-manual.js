#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔧 Manual MCP Server Test");
console.log("========================\n");

// Check GitHub token
if (!process.env.GITHUB_TOKEN) {
  console.log("⚠️  GITHUB_TOKEN not set. Set it with:");
  console.log("   export GITHUB_TOKEN=your_token_here\n");
}

console.log("Available test commands:");
console.log("1. list - List available tools");
console.log("2. search <query> - Search for projects");
console.log("3. details <owner> <repo> - Get project details");
console.log("4. alternatives <owner> <repo> - Find alternatives");
console.log("5. quit - Exit\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function sendRequest(request) {
  return new Promise((resolve, reject) => {
    const server = spawn("node", [join(__dirname, "dist", "index.js")], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let error = "";

    server.stdout.on("data", (data) => {
      output += data.toString();
    });

    server.stderr.on("data", (data) => {
      error += data.toString();
    });

    server.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Server exited with code ${code}: ${error}`));
        return;
      }

      try {
        const response = JSON.parse(output);
        resolve(response);
      } catch (e) {
        reject(new Error(`Failed to parse response: ${e.message}`));
      }
    });

    server.on("error", (err) => {
      reject(new Error(`Failed to start server: ${err.message}`));
    });

    server.stdin.write(JSON.stringify(request) + "\n");
    server.stdin.end();

    setTimeout(() => {
      server.kill();
      reject(new Error("Request timeout"));
    }, 15000);
  });
}

async function handleCommand(input) {
  const parts = input.trim().split(" ");
  const command = parts[0].toLowerCase();

  try {
    switch (command) {
      case "list":
        console.log("\n📋 Listing tools...");
        const listResponse = await sendRequest({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {},
        });

        if (listResponse.result && listResponse.result.tools) {
          console.log(`\n✅ Found ${listResponse.result.tools.length} tools:`);
          listResponse.result.tools.forEach((tool, index) => {
            console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
          });
        } else {
          console.log("❌ Failed to list tools:", listResponse);
        }
        break;

      case "search":
        if (parts.length < 2) {
          console.log("❌ Usage: search <query>");
          break;
        }

        const query = parts.slice(1).join(" ");
        console.log(`\n🔍 Searching for: "${query}"`);

        const searchResponse = await sendRequest({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "search_oss_projects",
            arguments: {
              query: query,
              minStars: 100,
            },
          },
        });

        if (searchResponse.result && searchResponse.result.content) {
          const content = JSON.parse(searchResponse.result.content[0].text);
          console.log(`\n✅ Found ${content.totalFound} projects:`);
          content.recommendations.slice(0, 5).forEach((repo, index) => {
            console.log(
              `   ${index + 1}. ${repo.name} (${repo.stars} ⭐) - ${
                repo.description
              }`
            );
          });
        } else {
          console.log("❌ Search failed:", searchResponse);
        }
        break;

      case "details":
        if (parts.length < 3) {
          console.log("❌ Usage: details <owner> <repo>");
          break;
        }

        const [owner, repo] = parts.slice(1);
        console.log(`\n📊 Getting details for: ${owner}/${repo}`);

        const detailsResponse = await sendRequest({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "get_project_details",
            arguments: {
              owner: owner,
              repo: repo,
            },
          },
        });

        if (detailsResponse.result && detailsResponse.result.content) {
          const content = JSON.parse(detailsResponse.result.content[0].text);
          console.log(`\n✅ Project Details:`);
          console.log(`   Name: ${content.name}`);
          console.log(`   Stars: ${content.stars} ⭐`);
          console.log(`   Language: ${content.language}`);
          console.log(`   Description: ${content.description}`);
          console.log(`   URL: ${content.url}`);
        } else {
          console.log("❌ Failed to get details:", detailsResponse);
        }
        break;

      case "alternatives":
        if (parts.length < 3) {
          console.log("❌ Usage: alternatives <owner> <repo>");
          break;
        }

        const [altOwner, altRepo] = parts.slice(1);
        console.log(`\n🔄 Finding alternatives to: ${altOwner}/${altRepo}`);

        const altResponse = await sendRequest({
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "recommend_alternatives",
            arguments: {
              owner: altOwner,
              repo: altRepo,
              limit: 5,
            },
          },
        });

        if (altResponse.result && altResponse.result.content) {
          const content = JSON.parse(altResponse.result.content[0].text);
          console.log(`\n✅ Alternatives to ${content.originalRepo.name}:`);
          content.alternatives.forEach((alt, index) => {
            console.log(
              `   ${index + 1}. ${alt.name} (${alt.stars} ⭐) - ${
                alt.description
              }`
            );
          });
        } else {
          console.log("❌ Failed to find alternatives:", altResponse);
        }
        break;

      case "quit":
      case "exit":
        console.log("\n👋 Goodbye!");
        rl.close();
        process.exit(0);
        break;

      default:
        console.log(
          "❌ Unknown command. Available: list, search, details, alternatives, quit"
        );
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  while (true) {
    const input = await askQuestion("\n> ");
    await handleCommand(input);
  }
}

main().catch(console.error);
