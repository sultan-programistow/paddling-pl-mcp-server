# paddling.pl — MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for
**paddling.pl** — an online shop for ordering paddling adventures. Built to be
hosted as a Vercel Function / Next.js API route using the
[`mcp-handler`](https://www.npmjs.com/package/mcp-handler) package, following
the official
[Vercel docs](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel).

> **Status:** Step 1 of the Vercel guide — the MCP server is implemented and
> ready to be **tested locally**. OAuth and deployment to Vercel are the next
> (not yet done) steps.

## Stack

- **Next.js 16** (App Router) — hosts the MCP endpoint as an API route
- **mcp-handler 1.x** — turns the MCP server into a Web-standard HTTP handler
- **@modelcontextprotocol/sdk 1.26** — the MCP protocol implementation
- **zod 4** — input schema validation for tool arguments
- **TypeScript 5**

## Project structure

```
.
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts      # ← the MCP server (createMcpHandler + tools)
│   ├── layout.tsx
│   └── page.tsx              # simple landing page (endpoint + how to test)
├── package.json
├── tsconfig.json
└── next-env.d.ts
```

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run the app locally (http://localhost:3000)
npm run dev
```

The MCP endpoint is served at:

```
http://localhost:3000/api/mcp   (Streamable HTTP transport)
```

## Test the MCP server locally

> From the
> [Vercel docs](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel#test-the-mcp-server-locally).
> Assumes the app from the previous step is running at `http://localhost:3000`.

1. **Run the MCP inspector** (in a second terminal):

   ```bash
   npm run inspect
   # …or equivalently: npx @modelcontextprotocol/inspector
   ```

2. **Open the inspector interface** — browse to
   `http://127.0.0.1:6274` (where the inspector runs by default).

3. **Connect to your MCP server**:
   - Select **Streamable HTTP** in the drop-down on the left.
   - In the **URL** field, use `http://localhost:3000/api/mcp`.
   - Expand **Configuration**.
   - In the **Proxy Session Token** field, paste the token from the terminal
     where your MCP server is running *(only present when running behind the
     Vercel proxy — leave blank for a plain `npm run dev`)*.
   - Click **Connect**.

4. **Test the tools**:
   - Click **List Tools** under Tools.
   - Click on the `roll_dice` tool.
   - Test it using the options on the right of the tools section (e.g. call it
     with `sides: 6`).

## Available tools

| Tool       | Description            | Arguments                         |
| ---------- | ---------------------- | --------------------------------- |
| `roll_dice`| Rolls an N-sided die   | `sides` (integer, minimum 2)      |

> The current tool is the `roll_dice` example from the Vercel docs. This is the
> placeholder to verify the setup works end-to-end — it will be replaced by
> paddling.pl tools (list adventures, get details, book an adventure, …).

## Notes on versions

The Vercel doc targets the **mcp-handler 1.x** API (`server.tool(...)`,
`basePath`, `@modelcontextprotocol/sdk` 1.x). This project pins that line so
the code matches the doc. A **2.x** release of `mcp-handler` exists with a
different API (`server.registerTool(...)`, no `basePath`, `@modelcontextprotocol/server`
v2, stateless, no Redis) — migrate to it intentionally when ready.

mcp-handler 1.x runs the Streamable HTTP transport in **stateless mode**, so
the local setup works without Redis (Redis is only needed for the SSE
endpoint, which we don't use).

## Next steps (not implemented)

- [ ] Replace `roll_dice` with real paddling.pl tools
- [ ] Enable authorization (OAuth) with `withMcpAuth` + an OAuth metadata
      endpoint, per the Vercel docs
- [ ] Deploy to Vercel and connect an MCP host (Cursor / Claude Desktop) via
      Streamable HTTP
