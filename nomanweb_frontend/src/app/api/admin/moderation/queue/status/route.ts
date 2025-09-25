import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No valid authorization header' },
        { status: 401 }
      );
    }

    // Forward the request to the Spring Boot backend
    const response = await fetch(`${BACKEND_URL}/admin/moderation/queue/status`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
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
        { error: 'Backend server error' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch queue status' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Queue status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during queue status fetch' },
      { status: 500 }
    );
  }
}