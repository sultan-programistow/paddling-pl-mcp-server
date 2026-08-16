# paddling.pl — MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for
**paddling.pl** — a Polish marketplace aggregating kayaking-trip offers from
local operators across Poland, letting users discover routes, compare offers,
check availability, and book & pay online. Built to be hosted as a Vercel
Function / Next.js API route using the
[`mcp-handler`](https://www.npmjs.com/package/mcp-handler) package, following
the official
[Vercel docs](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel).

## About paddling.pl

Paddling.pl is a kayaking-trip marketplace founded in 2025 and headquartered in
Gdańsk, Poland. It gathers verified local organizers across Poland's
voivodeships — from family-friendly one-day routes to multi-day expeditions —
and digitizes booking: users find routes matched to their needs, check
availability, and reserve & pay online in minutes, while organizers gain a
modern channel to reach new customers. Its mission is to digitize and simplify
the Polish kayaking market.

> **Status:** Step 1 of the Vercel guide — the MCP server is implemented and
> ready to be **tested locally**. OAuth and deployment to Vercel are the next
> (not yet done) steps.

## Endpoint

```
https://paddling-pl-mcp-server.vercel.app/api/mcp   (Streamable HTTP transport)
```

For local development, the endpoint is served at `http://localhost:3000/api/mcp`.

## Available tools

| Tool       | Description            | Arguments                         |
| ---------- | ---------------------- | --------------------------------- |
| `roll_dice`| Rolls an N-sided die   | `sides` (integer, minimum 2)      |

> The current tool is the `roll_dice` example from the Vercel docs. This is the
> placeholder to verify the setup works end-to-end — it will be replaced by
> paddling.pl tools (list adventures, get details, book an adventure, …).

## For developers

### Stack

- **Next.js 16** (App Router) — hosts the MCP endpoint as an API route
- **mcp-handler 2.x** — turns the MCP server into a Web-standard HTTP handler
- **@modelcontextprotocol/server 2** — the MCP protocol implementation
- **zod 4** — input schema validation for tool arguments
- **TypeScript 7**

### Getting started

```bash
npm install
npm run dev   # http://localhost:3000
```

Test the server with the MCP Inspector via `npm run inspect` (see the
[Vercel docs](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel#test-the-mcp-server-locally)).

### Project structure

```
app/api/mcp/route.ts   # ← the MCP server (createMcpHandler + tools)
app/page.tsx           # landing page
```

### Version notes

mcp-handler 2.x serves the Streamable HTTP transport in **stateless mode**, so
local testing needs **no Redis** (the SSE transport was removed in 2.x). The
2.x API uses `server.registerTool(...)` with a full Standard Schema
(`z.object({...})`) — no `basePath`. Requires Node.js 20+.

### Next steps

- [ ] Replace `roll_dice` with real paddling.pl tools
- [ ] Enable authorization (OAuth) with `withMcpAuth` + an OAuth metadata endpoint
- [ ] Deploy to Vercel and connect an MCP host (Cursor / Claude Desktop)