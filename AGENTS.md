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

## mcp-handler 1.x — don't "fix" the API

`app/api/mcp/route.ts` uses the mcp-handler **1.x** API: `server.tool(...)` inside
`createMcpHandler(..., { basePath: '/api' })`, exporting the handler as
`GET`/`POST`/`DELETE`. A **2.x** release exists with an incompatible API
(`server.registerTool(...)`, no `basePath`). `package.json` pins `^1.1.0` — keep
1.x unless intentionally migrating (the 2.x diff is documented in README.md).

## Runtime quirks

- mcp-handler 1.x runs the Streamable HTTP transport in **stateless mode**:
  local testing needs **no Redis**. Redis is only needed for the SSE endpoint,
  which this project doesn't use.
- `.env` exists locally but is gitignored — treat its contents as secrets; never
  log or commit them.
- Not a git repository (yet). Next steps per README: replace the placeholder
  `roll_dice` tool with real paddling.pl tools, add OAuth (`withMcpAuth` +
  OAuth metadata endpoint), then deploy to Vercel.