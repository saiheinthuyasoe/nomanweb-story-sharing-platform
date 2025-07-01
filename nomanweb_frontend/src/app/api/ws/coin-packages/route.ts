import { NextRequest } from 'next/server';

// Store active WebSocket connections
const connections = new Set<WebSocket>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const upgrade = request.headers.get('upgrade');
  
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  try {
    // For development, we'll use a simple polling mechanism
    // In production, you would use a proper WebSocket server
    const response = new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    });

    return response;
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    return new Response('WebSocket upgrade failed', { status: 500 });
  }
}

// Helper function to broadcast updates to all connected clients
export function broadcastCoinPackageUpdate(type: string, data: any) {
  const message = JSON.stringify({ type, ...data });
  
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        connections.delete(ws);
      }
    } else {
      connections.delete(ws);
    }
  });
} 