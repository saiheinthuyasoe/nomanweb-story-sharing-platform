import { NextRequest } from 'next/server';
import { addConnection, removeConnection } from '@/lib/broadcast';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the shared set
      addConnection(controller);
      
      // Send initial connection message
      const data = JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() });
      controller.enqueue(`data: ${data}\n\n`);
      
      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() });
          controller.enqueue(`data: ${heartbeatData}\n\n`);
        } catch (error) {
          console.error('Heartbeat error:', error);
          removeConnection(controller);
          clearInterval(heartbeat);
        }
      }, 30000); // Send heartbeat every 30 seconds
      
      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        removeConnection(controller);
        clearInterval(heartbeat);
        controller.close();
      });
    },
    cancel(controller) {
      removeConnection(controller);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
} 