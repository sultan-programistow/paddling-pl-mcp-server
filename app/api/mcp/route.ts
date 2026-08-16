import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'roll_dice',
      {
        title: 'Roll Dice',
        description: 'Rolls an N-sided die',
        inputSchema: z.object({
          sides: z.number().int().min(2),
        }),
      },
      async ({ sides }) => {
        const value = 1 + Math.floor(Math.random() * sides);
        return {
          content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }],
        };
      },
    );
  },
  {
    serverInfo: {
      name: 'paddling-pl-mcp-server',
      version: '0.1.0',
    },
  },
);

export { handler as GET, handler as POST };