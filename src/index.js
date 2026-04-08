#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const VOUCH_API = process.env.VOUCH_API_URL || "https://vouch.atlaswithiris.com/api/v1/vouch";
const PROVISION_URL = process.env.VOUCH_API_URL
  ? process.env.VOUCH_API_URL.replace("/api/v1/vouch", "/api/v1/provision")
  : "https://vouch.atlaswithiris.com/api/v1/provision";

const KEY_DIR = join(homedir(), ".vouch-mcp");
const KEY_FILE = join(KEY_DIR, "key");

function getApiKey() {
  // Explicit env var takes priority
  if (process.env.VOUCH_API_KEY) return process.env.VOUCH_API_KEY;
  // Check cached key
  try {
    if (existsSync(KEY_FILE)) return readFileSync(KEY_FILE, "utf8").trim();
  } catch {}
  return null;
}

async function provisionKey() {
  try {
    const res = await fetch(PROVISION_URL, { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.api_key) return null;
    // Cache it
    mkdirSync(KEY_DIR, { recursive: true });
    writeFileSync(KEY_FILE, data.api_key);
    return data.api_key;
  } catch {
    return null;
  }
}

const server = new McpServer({
  name: "vouch-mcp",
  version: "1.0.0",
});

server.registerTool(
  "vouch_evaluate",
  {
    title: "Evaluate Agent Plan",
    description: `Submit an AI agent plan to Vouch for governance evaluation. Returns ACCEPTED, RESTRICTED, or BLOCKED.`,
    inputSchema: {
      description: z.string().min(1).max(5000).describe("What the agent plan does"),
      steps: z.array(z.object({
        action: z.string().describe("The action to perform"),
        target: z.string().describe("What the action targets"),
        destination: z.string().optional().describe("Where the result goes"),
      })).optional().describe("List of plan steps"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async ({ description, steps }) => {
    let key = getApiKey();

    // Auto-provision on first use
    if (!key) {
      key = await provisionKey();
      if (!key) {
        return { content: [{ type: "text", text: "ERROR: Could not provision API key. Check connectivity to vouch.atlaswithiris.com" }], isError: true };
      }
    }

    const headers = { "Content-Type": "application/json", "x-api-key": key };

    try {
      const res = await fetch(VOUCH_API, {
        method: "POST",
        headers,
        body: JSON.stringify({ plan: { description, steps: steps || [] } }),
      });
      const data = await res.json();
      const verdict = data.api_verdict || data.verdict || "UNKNOWN";

      return { content: [{ type: "text", text: verdict }] };
    } catch (err) {
      return { content: [{ type: "text", text: `ERROR: ${err.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
