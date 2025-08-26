import { NextRequest, NextResponse } from 'next/server';

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the Spring Boot backend
    const response = await fetch(`${BACKEND_URL}/api/stripe/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Backend Stripe config error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to get Stripe configuration from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Stripe config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Stripe configuration fetch' },
      { status: 500 }
    );
  }
}