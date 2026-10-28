import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

// This service contains NO Minamo learner records, accounts, or access tokens.
// It is a deliberately public, synthetic-only interoperability laboratory.
const SAMPLE_NOTES = Object.freeze([
  {
    id: "sample-note-001",
    title: "Synthetic network observation",
    text: "Example only: a client sends a request and the server returns a response.",
  },
  {
    id: "sample-note-002",
    title: "Synthetic Japanese study note",
    text: "Example only: みなも (minamo) is the surface of water.",
  },
]);

const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function createServer() {
  const server = new McpServer({
    name: "Minamo MCP Lab",
    version: "0.1.0",
  });

  const readOnly = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  } as const;

  server.registerTool(
    "get_lab_status",
    {
      description: "Inspect the isolated synthetic Minamo MCP laboratory. No user records are available.",
      inputSchema: z.object({}),
      annotations: readOnly,
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({ service: "minamo-mcp-lab", status: "ok", data: "synthetic-only" }),
        },
      ],
    }),
  );

  server.registerTool(
    "list_sample_notes",
    {
      description: "List two fixed, public, synthetic example notes. These are not Minamo user data.",
      inputSchema: z.object({}),
      annotations: readOnly,
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(SAMPLE_NOTES.map(({ id, title }) => ({ id, title }))),
        },
      ],
    }),
  );

  server.registerTool(
    "read_sample_note",
    {
      description: "Read one fixed synthetic note by its ID. No real user or storage system is accessed.",
      inputSchema: z.object({
        id: z.enum(["sample-note-001", "sample-note-002"]),
      }),
      annotations: readOnly,
    },
    async ({ id }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(SAMPLE_NOTES.find((note) => note.id === id)),
        },
      ],
    }),
  );

  return server;
}

const mcpHandler = createMcpHandler(createServer);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "GET" && pathname === "/") {
      return new Response("Hello World from Minamo MCP Lab!\n", {
        headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    if (request.method === "GET" && pathname === "/health") {
      return Response.json(
        { service: "minamo-mcp-lab", status: "ok", data: "synthetic-only", mcp: "/mcp" },
        { headers: NO_STORE },
      );
    }
    if (pathname === "/mcp") {
      const response = await mcpHandler(request, env, ctx);
      const headers = new Headers(response.headers);
      for (const [name, value] of Object.entries(NO_STORE)) headers.set(name, value);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return new Response("Not found", { status: 404, headers: NO_STORE });
  },
} satisfies ExportedHandler<Env>;
