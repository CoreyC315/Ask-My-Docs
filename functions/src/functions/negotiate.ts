import { app } from '@azure/functions';
import { randomUUID } from 'crypto';
import { getClientAccessToken } from '../lib/signalr';

// The browser calls this before opening a WebSocket connection to SignalR.
// It returns a URL and a short-lived access token. The browser uses those
// to connect directly to the SignalR service — traffic never flows through
// the Function App after this point.
app.http('negotiate', {
  methods: ['GET', 'POST'],
  route: 'negotiate',
  authLevel: 'anonymous',
  handler: async (request) => {
    const userId =
      new URL(request.url).searchParams.get('userId') ?? randomUUID();

    const connectionInfo = getClientAccessToken('chat', userId);

    // Return the userId too so the frontend knows which user ID to include
    // in the query request — SignalR uses it to route tokens to the right connection.
    return { jsonBody: { ...connectionInfo, userId } };
  },
});
