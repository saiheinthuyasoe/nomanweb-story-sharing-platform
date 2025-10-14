import { NextRequest, NextResponse } from 'next/server';

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Forward the request to the Spring Boot backend
    const response = await fetch(`${BACKEND_URL}/api/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    // Even if the backend logout fails, we return success to avoid information leakage
    // This matches the backend behavior
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Admin logout API error:', error);
    // Even on error, return success for security reasons
    return NextResponse.json({ success: true });
  }
}