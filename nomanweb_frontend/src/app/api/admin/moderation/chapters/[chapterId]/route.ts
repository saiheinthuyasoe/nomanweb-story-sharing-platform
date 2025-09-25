import { NextRequest, NextResponse } from 'next/server';

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

export async function POST(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No valid authorization header' },
        { status: 401 }
      );
    }

    const { chapterId } = params;
    
    // Get form data from request
    const formData = await request.formData();
    const notes = formData.get('notes') as string;
    const approved = formData.get('approved') as string;

    // Create URLSearchParams for the backend request
    const bodyParams = new URLSearchParams({
      notes: notes || '',
      approved: approved
    });

    // Forward the request to the Spring Boot backend
    const response = await fetch(
      `${BACKEND_URL}/api/admin/moderation/chapters/${chapterId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString()
      }
    );

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
        { error: data.message || 'Failed to moderate chapter' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Chapter moderation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during chapter moderation' },
      { status: 500 }
    );
  }
}