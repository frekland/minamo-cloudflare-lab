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

## GitHub Actions deployment

The [Deploy MCP lab to Cloudflare](.github/workflows/deploy.yml) workflow is an alternative to Cloudflare's native Git repository connection. After the first successful manual deployment, it now deploys automatically when lab source, tests, dependencies or Worker configuration change on `main`. Manual runs remain available. Documentation-only changes do not deploy.

One-time setup:

1. In this GitHub repository, open **Settings > Secrets and variables > Actions > New repository secret**.
2. Name it `CLOUDFLARE_API_TOKEN` and paste the token created in the Cloudflare Worker's **Settings > Builds > API token for external CI/CD** section. Never commit or share the token.
3. In **Actions**, select **Deploy MCP lab to Cloudflare** to inspect automatic runs, or choose **Run workflow** on `main` for a manual deployment.

The account ID is already configured in the workflow. The workflow installs locked dependencies, generates types, type-checks, validates the bundle, checks the existing synthetic MCP endpoint, deploys only this `minamo-mcp-lab` Worker, then runs the synthetic endpoint smoke tests again. It does **not** deploy native Minamo V2.

If an Actions run fails before any job step starts, inspect repository **Settings > Actions > General** and account billing/Actions usage. Such a failure is not evidence of a failed Worker build; resolve runner allocation before trying to deploy.
