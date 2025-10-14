import { NextRequest, NextResponse } from 'next/server';

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

export async function GET(request: NextRequest) {
  try {
    // Extract admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminToken = authHeader.substring(7);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '10';
    const status = searchParams.get('status') || '';

    // Build query string for backend
    const queryParams = new URLSearchParams({
      page,
      size,
      ...(status && { status })
    });

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/api/admin/moderation/feedback?${queryParams}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch feedback submissions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in feedback submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}