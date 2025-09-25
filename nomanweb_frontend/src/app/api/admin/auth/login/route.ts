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
    const fullUrl = `${BACKEND_URL}/api/admin/auth/login`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Backend is not running or returning HTML error page
      const text = await response.text();
      console.error('Backend response is not JSON:', text);
      return NextResponse.json(
        { error: 'Backend server is not running or not responding properly. Please start the Spring Boot backend server.' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Admin login failed' },
        { status: response.status }
      );
    }

    // Return successful login response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during admin login' },
      { status: 500 }
    );
  }
} 