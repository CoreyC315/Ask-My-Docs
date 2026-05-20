import jwt from 'jsonwebtoken';

// SignalR connection strings look like:
//   Endpoint=https://sigr-askmydocs-dev.service.signalr.net;AccessKey=xxx;Version=1.0;
// We parse them into parts so we can build signed URLs and tokens.
function parseConnectionString(cs: string): { endpoint: string; accessKey: string } {
  const parts: Record<string, string> = {};
  for (const segment of cs.split(';')) {
    const eq = segment.indexOf('=');
    if (eq !== -1) parts[segment.slice(0, eq)] = segment.slice(eq + 1);
  }
  return {
    endpoint: parts.Endpoint.replace(/\/$/, ''),
    accessKey: parts.AccessKey,
  };
}

// Called by the negotiate function.
// Returns the WebSocket URL and a signed JWT the browser uses to authenticate
// with the SignalR service. The JWT contains the userId as its subject so
// SignalR knows which connection belongs to which user.
export function getClientAccessToken(
  hubName: string,
  userId: string
): { url: string; accessToken: string } {
  const { endpoint, accessKey } = parseConnectionString(
    process.env.AZURE_SIGNALR_CONNECTION_STRING!
  );

  const url = `${endpoint}/client/?hub=${hubName}`;

  const accessToken = jwt.sign({}, accessKey, {
    audience: url,
    subject: userId,
    expiresIn: '1h',
  });

  return { url, accessToken };
}

// Called by the query function to push a message to a specific user.
// SignalR routes it to whichever WebSocket connection has that userId.
// `target` is the event name the frontend listens for (e.g. 'token', 'done').
// `args` is the array of arguments passed to the event handler.
export async function sendToUser(
  hubName: string,
  userId: string,
  target: string,
  args: unknown[]
): Promise<void> {
  const { endpoint, accessKey } = parseConnectionString(
    process.env.AZURE_SIGNALR_CONNECTION_STRING!
  );

  // The audience for a REST API call is scoped to the specific endpoint URL.
  const apiUrl = `${endpoint}/api/v1/hubs/${hubName}/users/${encodeURIComponent(userId)}`;

  const token = jwt.sign({}, accessKey, {
    audience: apiUrl,
    expiresIn: '5m',
  });

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ target, arguments: args }),
  });

  if (!res.ok) {
    throw new Error(`SignalR push failed: ${res.status} ${await res.text()}`);
  }
}
