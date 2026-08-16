export default function Home() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 640,
        margin: '0 auto',
        padding: '4rem 1.5rem',
      }}
    >
      <h1>🛶 paddling.pl MCP Server</h1>
      <p>
        Model Context Protocol server for <strong>paddling.pl</strong> — an
        online shop for ordering paddling adventures.
      </p>

      <h2>MCP endpoint</h2>
      <p>
        <code>http://localhost:3000/api/mcp</code> (Streamable HTTP transport)
      </p>

      <h2>Available tools</h2>
      <ul>
        <li>
          <code>roll_dice</code> — Rolls an N-sided die
        </li>
      </ul>

      <h2>Test locally</h2>
      <ol>
        <li>
          Run <code>npm run dev</code>
        </li>
        <li>
          Run <code>npm run inspect</code> in a second terminal
        </li>
        <li>
          Open <code>http://127.0.0.1:6274</code>, select{' '}
          <strong>Streamable HTTP</strong>, set the URL to{' '}
          <code>http://localhost:3000/api/mcp</code> and click{' '}
          <strong>Connect</strong>
        </li>
        <li>
          Click <strong>List Tools</strong> and try <code>roll_dice</code>
        </li>
      </ol>
    </main>
  );
}
