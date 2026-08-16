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
https://paddling-pl-mcp-server.vercel.app/api/mcp
```

For local development, the endpoint is served at `http://localhost:3000/api/mcp`.

## Available tools

| Tool                   | Description                                                                 | Arguments                                             |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| `search_trips`         | Lists kayaking trips, optionally filtered; includes a direct link per trip  | `voivodeships` (array of region codes), `dateFrom`/`dateTo` (YYYY-MM-DD), `minPersons` (int ≥ 1), `page` (int ≥ 0), `size` (int 1–100) |
| `get_trip_availability`| Returns the available dates for a trip                                      | `tripId` (UUID)                                       |
| `get_trip_resources`   | Source of truth for real equipment availability on a given date            | `tripId` (UUID), `date` (YYYY-MM-DD)                  |

`search_trips` `voivodeships` accept any of: `DOLNOSLASKIE`, `KUJAWSKO_POMORSKIE`,
`LUBELSKIE`, `LUBUSKIE`, `LODZKIE`, `MALOPOLSKIE`, `MAZOWIECKIE`, `OPOLSKIE`,
`PODKARPACKIE`, `PODLASKIE`, `POMORSKIE`, `SLASKIE`, `SWIETOKRZYSKIE`,
`WARMINSKO_MAZURSKIE`, `WIELKOPOLSKIE`, `ZACHODNIOPOMORSKIE`, `ZAGRANICA`.

> Trip links from `search_trips` use the form
> `https://paddling.pl/trips/{rentalSlug}/{tripSlug}`.

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