import { NextRequest, NextResponse } from 'next/server';

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get client IP and user agent for security logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Add IP and user agent to the request body for backend logging
    const requestBody = {
      ...body,
      ipAddress: clientIP,
      userAgent: userAgent
    };

    // Forward the request to the Spring Boot backend
    const response = await fetch(`${BACKEND_URL}/api/admin/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Admin registration failed' },
        { status: response.status }
      );
    }

    // Return successful registration response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Admin register API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during admin registration' },
      { status: 500 }
    );
  }
} 