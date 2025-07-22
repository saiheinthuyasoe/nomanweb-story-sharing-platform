import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const { chapterId } = params;
    
    // Get the user from the request
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    // Verify the JWT token and extract user information
    let user;
    try {
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret || jwtSecret === 'your-jwt-secret') {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const response = await fetch(`${backendUrl}/api/monetization/chapters/access/${chapterId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to check chapter access' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chapter access API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 