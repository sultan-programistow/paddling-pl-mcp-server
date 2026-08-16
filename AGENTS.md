<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# paddling.pl MCP server

Next.js 16 (App Router) app that exposes a **Model Context Protocol** server at
`/api/mcp` (Streamable HTTP transport) for the paddling.pl adventure shop. The
only real code is `app/api/mcp/route.ts`; `app/page.tsx` is a static landing
page. `CLAUDE.md` just imports this file.

## Commands

- `npm run dev` — dev server on http://localhost:3000
- `npm run build` — `next build`; this is the build/typecheck gate (no lint or test scripts exist)
- `npm run inspect` — launch MCP Inspector at http://127.0.0.1:6274; connect to `http://localhost:3000/api/mcp` (Streamable HTTP) to exercise tools
- `npx tsc --noEmit` — standalone typecheck (tsconfig sets `strict: true`)

## mcp-handler 2.x API

`app/api/mcp/route.ts` uses the mcp-handler **2.x** API: `server.registerTool(...)`
with an `inputSchema` that takes a full Standard Schema (`z.object({...})`),
inside `createMcpHandler(..., { serverInfo })`, exporting the handler as
`GET`/`POST`. There is no `basePath` (the handler is mounted at the route's own
path) and no Redis. Requires `@modelcontextprotocol/server` (v2) and zod ^4.
A **1.x** release used the old API (`server.tool(...)`, `basePath`,
`@modelcontextprotocol/sdk` 1.x) — don't revert to it.

## Runtime quirks

- mcp-handler 2.x serves the Streamable HTTP transport in **stateless mode**:
  local testing needs **no Redis** (SSE transport was removed in 2.x; Redis is
  not needed or used).
- `.env` exists locally but is gitignored — treat its contents as secrets; never
  log or commit them.
- Not a git repository (yet). Next steps per README: add more paddling.pl tools
  (get trip details, book an adventure), add OAuth (`withMcpAuth` + OAuth
  metadata endpoint), then deploy to Vercel.