import assert from "node:assert/strict";
import { test } from "node:test";

// Synthetic lab only. Never point this at production Minamo.
const BASE = process.env.MCP_TEST_BASE_URL ?? "http://127.0.0.1:8787";
const headers = {
  Accept: "application/json, text/event-stream",
  "Content-Type": "application/json",
  "MCP-Protocol-Version": "2025-11-25",
};

async function rpc(method, params = {}, id = 1) {
  const response = await fetch(new URL("/mcp", BASE), {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  const match = body.match(/^data: (.+)$/m);
  return { response, json: JSON.parse(match ? match[1] : body) };
}

test("health is synthetic-only and uncacheable", async () => {
  const response = await fetch(new URL("/health", BASE));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    service: "minamo-mcp-lab",
    status: "ok",
    data: "synthetic-only",
    mcp: "/mcp",
  });
});

test("legacy MCP initialize negotiates protocol", async () => {
  const { response, json } = await rpc("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "minamo-lab-smoke", version: "0.1.0" },
  });
  assert.equal(response.status, 200);
  assert.equal(json.result.protocolVersion, "2025-11-25");
  assert.equal(json.result.serverInfo.name, "Minamo MCP Lab");
});

test("modern MCP discovery uses complete metadata envelope", async () => {
  const response = await fetch(new URL("/mcp", BASE), {
    method: "POST",
    headers: {
      ...headers,
      "MCP-Protocol-Version": "2026-07-28",
      "Mcp-Method": "server/discover",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 17,
      method: "server/discover",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientCapabilities": {},
          "io.modelcontextprotocol/clientInfo": {
            name: "minamo-lab-smoke",
            version: "0.1.0",
          },
        },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.ok(json.result.supportedVersions.includes("2026-07-28"));
});

test("the three tools are read-only and synthetic", async () => {
  const { response, json } = await rpc("tools/list");
  assert.equal(response.status, 200);
  assert.deepEqual(
    json.result.tools.map((tool) => tool.name),
    ["get_lab_status", "list_sample_notes", "read_sample_note"],
  );
  for (const tool of json.result.tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.equal(tool.annotations.openWorldHint, false);
  }
});

test("fixture read returns a fixed synthetic note", async () => {
  const { response, json } = await rpc("tools/call", {
    name: "read_sample_note",
    arguments: { id: "sample-note-001" },
  });
  assert.equal(response.status, 200);
  assert.notEqual(json.result.isError, true);
  const note = JSON.parse(json.result.content[0].text);
  assert.equal(note.id, "sample-note-001");
  assert.match(note.text, /Example only/);
});

test("unknown fixture IDs are rejected", async () => {
  const { response, json } = await rpc("tools/call", {
    name: "read_sample_note",
    arguments: { id: "private-user-note" },
  });
  assert.equal(response.status, 200);
  assert.equal(json.result.isError, true);
});

test("unknown API route returns 404", async () => {
  const response = await fetch(new URL("/api/notes", BASE));
  assert.equal(response.status, 404);
});
