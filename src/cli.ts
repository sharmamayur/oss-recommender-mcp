#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple CLI wrapper for the MCP server
const serverPath = join(__dirname, "index.js");

console.log("Starting OSS Recommender MCP Server...");
console.log("Server path:", serverPath);

// Start the MCP server
const server = spawn("node", [serverPath], {
  stdio: "inherit",
});

server.on("close", (code) => {
  console.log(`MCP server exited with code ${code}`);
});

server.on("error", (error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down MCP server...");
  server.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down MCP server...");
  server.kill("SIGTERM");
  process.exit(0);
});
