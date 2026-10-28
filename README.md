# Minamo MCP Lab (synthetic only)

This isolated Cloudflare Worker proves remote MCP transport without any live Minamo users, records, credentials, D1 or R2 data. It is deliberately public and unauthenticated because every tool returns fixed synthetic fixtures. It is **not** a production Minamo deployment or an authentication proxy.

## Endpoints

- GET / — Hello World marker
- GET /health — synthetic-only health response
- POST /mcp — stateless MCP server (Cloudflare Agents SDK and official MCP server SDK)
- Three read-only tools: get_lab_status, list_sample_notes, read_sample_note

## Development

Node 24 is recommended. In this directory:

1. Run npm ci.
2. Run npm run cf-typegen.
3. Run npm run typecheck and npm run build.
4. Run npm run dev for a local Worker.
5. Run npm test with MCP_TEST_BASE_URL set to the isolated lab origin.

The provided smoke tests cover modern server discovery, legacy initialization, tool catalogue, a fixed note read, invalid ID rejection, health and unexpected routes.

Do not point smoke tests at the authenticated production Minamo Site. Do not add non-synthetic content, write tools, private network routes or binding resources without a separate security review.

## Deployment

The code was compiled into a Cloudflare Worker bundle and uploaded as a separate version before explicit deployment to the existing minamo-mcp-lab Worker. The previous Hello World version is retained for rollback. This repository does not automatically deploy the native Minamo V2 source.

The live lab origin is https://minamo-mcp-lab.jlscott-uk.workers.dev.

## Self-hosting route

See docs/SELF-HOSTING-GATES.md for the V2 compatibility findings and security gates. V2 already builds for Workers and uses D1/R2; the principal blocker is replacing Sites-dispatched authentication with a verified, independently hosted issuer and preserving the existing per-owner protections.
