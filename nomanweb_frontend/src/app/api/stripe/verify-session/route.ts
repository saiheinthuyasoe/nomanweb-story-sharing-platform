import { NextRequest, NextResponse } from 'next/server';

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No valid authorization header' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Forward the request to the Spring Boot backend
    const response = await fetch(`${BACKEND_URL}/api/stripe/verify-session`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Backend response is not JSON:', text);
      return NextResponse.json(
        { error: 'Backend server error during session verification' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to verify session' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Verify session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during session verification' },
      { status: 500 }
    );
  }
}