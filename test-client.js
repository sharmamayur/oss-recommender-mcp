#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🧪 Testing OSS Recommender MCP Server...\n");

// Test cases
const tests = [
  {
    name: "List Tools",
    request: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    },
  },
  {
    name: "Search React Projects",
    request: {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "search_oss_projects",
        arguments: {
          query: "react library",
          language: "javascript",
          minStars: 1000,
        },
      },
    },
  },
  {
    name: "Get Project Details",
    request: {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "get_project_details",
        arguments: {
          owner: "facebook",
          repo: "react",
        },
      },
    },
  },
  {
    name: "Find Alternatives",
    request: {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "recommend_alternatives",
        arguments: {
          owner: "facebook",
          repo: "react",
          limit: 5,
        },
      },
    },
  },
];

async function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Running: ${test.name}`);

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
        console.log(`❌ ${test.name} failed with code ${code}`);
        if (error) console.log("Error:", error);
        reject(new Error(`Test failed with code ${code}`));
        return;
      }

      try {
        const response = JSON.parse(output);
        if (response.error) {
          console.log(`❌ ${test.name} failed:`, response.error.message);
          reject(new Error(response.error.message));
        } else {
          console.log(`✅ ${test.name} passed`);
          if (test.name === "List Tools") {
            console.log(`   Found ${response.result.tools.length} tools`);
          } else if (response.result && response.result.content) {
            const content = JSON.parse(response.result.content[0].text);
            if (content.recommendations) {
              console.log(
                `   Found ${content.recommendations.length} recommendations`
              );
            } else if (content.name) {
              console.log(
                `   Project: ${content.name} (${content.stars} stars)`
              );
            }
          }
        }
        resolve(response);
      } catch (e) {
        console.log(`❌ ${test.name} failed to parse response:`, e.message);
        console.log("Raw output:", output);
        reject(e);
      }
    });

    server.on("error", (err) => {
      console.log(`❌ ${test.name} failed to start:`, err.message);
      reject(err);
    });

    // Send the request
    server.stdin.write(JSON.stringify(test.request) + "\n");
    server.stdin.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      server.kill();
      reject(new Error("Test timeout"));
    }, 10000);
  });
}

async function runAllTests() {
  console.log("🚀 Starting MCP Server Tests...\n");

  // Check if GitHub token is set
  if (!process.env.GITHUB_TOKEN) {
    console.log("⚠️  Warning: GITHUB_TOKEN not set. Some tests may fail.");
    console.log("   Set it with: export GITHUB_TOKEN=your_token_here\n");
  }

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTest(test);
      passed++;
    } catch (error) {
      failed++;
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log("\n📊 Test Results:");
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(
    `   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 All tests passed! The MCP server is working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Check the errors above.");
  }
}

// Run the tests
runAllTests().catch(console.error);
