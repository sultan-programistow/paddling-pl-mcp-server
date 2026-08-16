'use client';

import { useState } from 'react';

const ENDPOINT = 'https://paddling-pl-mcp-server.vercel.app/api/mcp';

const TOOLS = [
  {
    name: 'roll_dice',
    description: 'Rolls an N-sided die',
    args: 'sides (integer, minimum 2)',
  },
];

const PROVIDERS = [
  {
    name: 'ChatGPT',
    steps: [
      <>
        Open ChatGPT → Settings → Workspace → Connectors{' '}
        <a
          href="https://help.openai.com/en/articles/11487775-connectors-in-chatgpt"
          target="_blank"
          rel="noreferrer"
        >
          (docs)
        </a>
      </>,
      <>
        Click "Add a connector", choose a custom connector
      </>,
      <>
        Paste the endpoint URL: <code>{ENDPOINT}</code>
      </>,
    ],
  },
  {
    name: 'Claude (Claude Code / Claude Desktop)',
    steps: [
      <>
        Run <code>claude mcp add --transport http paddling-pl {ENDPOINT}</code>{' '}
        in your terminal (or add it interactively via{' '}
        <code>claude mcp add</code>){' '}
        <a
          href="https://code.claude.com/docs/en/mcp"
          target="_blank"
          rel="noreferrer"
        >
          (docs)
        </a>
      </>,
      <>
        Restart the session — the tools will be available to Claude
      </>,
    ],
  },
  {
    name: 'Cursor',
    steps: [
      <>
        Open Settings → MCP → "Add new MCP server"{' '}
        <a href="https://cursor.com/docs/mcp" target="_blank" rel="noreferrer">
          (docs)
        </a>
      </>,
      <>Give it a name and paste the endpoint URL</>,
      <>Select the Streamable HTTP transport and connect</>,
    ],
  },
  {
    name: 'LM Studio',
    steps: [
      <>
        Open LM Studio → Program tab → Install → Edit <code>mcp.json</code>{' '}
        (see{' '}
        <a href="https://lmstudio.ai/docs/app/mcp" target="_blank" rel="noreferrer">
          LM Studio docs
        </a>
        )
      </>,
      <>
        Add the server entry inside <code>mcpServers</code>:{' '}
        <pre style={{ margin: '0.5rem 0' }}>
          {`{
  "mcpServers": {
    "paddling-pl": {
      "url": "${ENDPOINT}"
    }
  }
}`}
        </pre>
      </>,
      <>
        Reload the MCP servers — the tools will be available to your models
      </>,
    ],
  },
];

export default function Home() {
  const [providerName, setProviderName] = useState(PROVIDERS[0].name);
  const selectedProvider =
    PROVIDERS.find((p) => p.name === providerName) ?? PROVIDERS[0];

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 720,
        margin: '0 auto',
        padding: '4rem 1.5rem',
        lineHeight: 1.6,
      }}
    >
      <h1>🛶 paddling.pl MCP Server</h1>
      <p>
        Model Context Protocol server for <strong>paddling.pl</strong> — a
        Polish marketplace for booking kayaking trips. Connect it to any MCP
        host (ChatGPT, Claude, Cursor, LM Studio, …) to let your AI assistant
        discover and book paddling adventures.
      </p>

      <h2>Endpoint</h2>
      <p>
        <code>{ENDPOINT}</code>
      </p>

      <h2>Available tools</h2>
      <ul>
        {TOOLS.map((tool) => (
          <li key={tool.name}>
            <code>{tool.name}</code> — {tool.description} ({tool.args})
          </li>
        ))}
      </ul>
      <p>
        More paddling.pl tools (list adventures, get details, book an
        adventure, …) are coming soon.
      </p>

      <h2>Connect it to your AI assistant</h2>
      <select
        value={providerName}
        onChange={(e) => setProviderName(e.target.value)}
        style={{ fontSize: 16, padding: '0.5rem', marginBottom: '1rem' }}
        aria-label="Choose your AI assistant"
      >
        {PROVIDERS.map((provider) => (
          <option key={provider.name} value={provider.name}>
            {provider.name}
          </option>
        ))}
      </select>
      <section key={selectedProvider.name}>
        <ol>
          {selectedProvider.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}