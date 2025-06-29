import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params as required by Next.js 15+
    const { userId } = await params;
    const { reason } = await request.json();
    
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Ban reason is required' },
        { status: 400 }
      );
    }

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
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: reason.trim()
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      return NextResponse.json(
        { error: errorData || 'Failed to ban user' },
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
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 