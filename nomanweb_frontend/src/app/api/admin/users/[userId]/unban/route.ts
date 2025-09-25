import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params as required by Next.js 15+
    const { userId } = await params;

    // Get admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const adminToken = authHeader.substring(7);

    // Forward request to backend
    const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');
    const backendResponse = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/unban`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      return NextResponse.json(
        { error: errorData || 'Failed to unban user' },
        { status: backendResponse.status }
      );
    }

    // Check if response has content before parsing JSON
    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await backendResponse.json();
      return NextResponse.json(result);
    } else {
      // If no JSON content, return success response
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}