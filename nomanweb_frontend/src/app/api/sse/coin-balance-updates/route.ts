import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Forward the request to the backend SSE endpoint (user-accessible)
    const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');
    const backendUrl = `${BACKEND_URL}/api`;
    const backendResponse = await fetch(`${backendUrl}/coins/sse/balance-updates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!backendResponse.ok) {
      return new NextResponse('Backend error', { status: backendResponse.status });
    }

    // Get the response body as a readable stream
    const stream = backendResponse.body;
    
    if (!stream) {
      return new NextResponse('No stream available', { status: 500 });
    }

    // Create a new response with the stream
    const response = new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

    return response;
  } catch (error) {
    console.error('SSE proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}