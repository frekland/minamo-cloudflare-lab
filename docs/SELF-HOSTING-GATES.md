# Minamo V2 self-hosting gates

Engineering assessment — 28 October 2026. No production data or access changes are authorized by this document.

## Existing portable architecture

The private V2 repository already uses Vinext, React, Vite and a Cloudflare Workers entry point (worker/index.ts). It builds with Node 24 / pnpm 11 and binds a D1 database as DB and R2 bucket as BUCKET. lib/domain.ts and lib/domain-handler.ts share HTTP and MCP validation. This should substantially reduce the work of independently hosting the application.

The nonportable part is trust and hosting integration. Sites dispatch currently supplies authenticated identity, while the Sites Vite plugin and .openai/hosting.json represent managed hosting. Public Cloudflare Workers do not automatically receive a trusted Sites principal.

## Mandatory migration gates

1. Never trust client-provided oai-authenticated-user-* headers at public Cloudflare ingress. Replace Sites dispatch with a verified identity adapter; do not bypass authorizeBeta, owner partitioning, optimistic concurrency, idempotent receipts, recovery or Source rights.
2. Confirm OAuth registration and supported ChatGPT callbacks (CIMD, DCR or real predefined client) with correct audience, scopes, issuer and revocation. A Sites-managed auth_client_id is not a portable registration grant.
3. Provision independent synthetic D1/R2 resources before considering source data migration. Use verified schema, backups and restore testing; no real learner records or credentials in the lab.
4. Re-execute cross-principal CRUD, media, history, search, cursors, recovery, account switching and revocation tests against the final identity boundary. Mocked identity headers do not prove live isolation.
5. The OpenAI directory's HTTP challenge must resolve on the eligible MCP hostname/parent. A separate workers.dev Worker cannot verify an unrelated chatgpt.site MCP origin.
6. Preserve the canonical private Site, Native Sites source and GitHub tree correspondence. Do not connect the entire V2 repository to automatic Worker deployment.

## Executed and next

- Synthetic Cloudflare Worker exists with a public workers.dev address and no bindings.
- SDK-based stateless /mcp now exposes three read-only hardcoded sample tools; tested against modern and legacy protocol request formats.
- Next: source-controlled dedicated private lab repository; automatic build and a known rollback version.
- Next: synthetic D1/R2 schema compatibility and recovery test plan (not yet provisioned).
- Blocked on owner/security decision: independent OAuth/identity design and any production data migration.
- Blocked on platform confirmation: public directory support for Sites-managed MCP and verification host.

Use Cloudflare Free resources where feasible. No domain purchase, paid service, private data copy, Site audience change, source merge or plugin submission follows from this lab.
