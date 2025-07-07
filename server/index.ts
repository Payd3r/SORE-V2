import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import Redis from 'ioredis';

const PORT = process.env.WSS_PORT || 3002;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_CHANNEL = 'momento-sync';

// Setup Redis subscriber
const subscriber = new Redis(REDIS_URL);
subscriber.subscribe(REDIS_CHANNEL, (err, count) => {
  if (err) {
    console.error('Failed to subscribe to Redis channel:', err);
    return;
  }
  console.log(`Subscribed to ${count} Redis channel(s). Listening for messages on '${REDIS_CHANNEL}'.`);
});

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

interface CustomWebSocket extends WebSocket {
  isAlive: boolean;
}

// Store connected clients
const clients = new Map<string, CustomWebSocket>();

function broadcast(message: string) {
  try {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.clientId) {
      const client = clients.get(parsedMessage.clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    } else {
      // Fallback to broadcast to all clients if no clientId is specified
      for (const client of clients.values()) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse or send message from Redis:', error);
  }
}

subscriber.on('message', (channel, message) => {
    if (channel === REDIS_CHANNEL) {
        console.log(`Received message from Redis: ${message}`);
        broadcast(message);
    }
});

wss.on('connection', (ws: CustomWebSocket, req) => {
  // Use a unique ID for each client, could be based on user auth in a real app
  const clientId = new URLSearchParams(req.url?.split('?')[1]).get('clientId') || `anonymous-${Math.random().toString(36).substring(2, 9)}`;
  ws.isAlive = true;
  clients.set(clientId, ws);

  console.log(`Client ${clientId} connected`);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message: string) => {
    console.log(`Received message from ${clientId}: ${message}`);
    // For now, just broadcast the message to all other clients
    const parsedMessage = JSON.parse(message);
    const broadcastMessage = JSON.stringify({
        ...parsedMessage,
        sender: clientId,
        timestamp: new Date().toISOString()
    });
    
    for (const [id, client] of clients.entries()) {
        if (id !== clientId && client.readyState === WebSocket.OPEN) {
            client.send(broadcastMessage);
        }
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });

  ws.on('error', (error) => {
    console.error(`Error with client ${clientId}:`, error);
    clients.delete(clientId);
  });

  // Send a welcome message
  ws.send(JSON.stringify({ type: 'welcome', message: `Welcome ${clientId}!`}));
});

// Heartbeat to check for stale connections
const interval = setInterval(() => {
  for (const [clientId, ws] of clients.entries()) {
    const customWs = ws as CustomWebSocket;
    if (customWs.isAlive === false) {
      console.log(`Terminating stale connection for client ${clientId}`);
      clients.delete(clientId);
      return ws.terminate();
    }

    customWs.isAlive = false;
    ws.ping();
  }
}, 30000); // 30 seconds

wss.on('close', () => {
  clearInterval(interval);
});


server.listen(PORT, () => {
  console.log(`🚀 WebSocket server is running on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 