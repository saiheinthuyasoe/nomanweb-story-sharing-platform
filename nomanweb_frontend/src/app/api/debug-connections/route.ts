import { NextResponse } from 'next/server';
import { getConnectionCount } from '@/lib/broadcast';

export async function GET() {
  try {
    const count = getConnectionCount();
    console.log(`🔍 Debug: Current SSE connections: ${count}`);
    
    return NextResponse.json({ 
      connectionCount: count,
      timestamp: Date.now(),
      message: count > 0 ? 'SSE connections active' : 'No SSE connections'
    });
  } catch (error) {
    console.error('Error in debug connections:', error);
    return NextResponse.json(
      { error: 'Failed to get connection info' },
      { status: 500 }
    );
  }
} 