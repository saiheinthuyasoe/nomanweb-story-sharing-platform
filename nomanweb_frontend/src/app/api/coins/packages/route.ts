import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend (no authentication required for public packages)
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/coins/packages`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Failed to fetch coin packages' },
        { status: response.status }
      );
    }

    const packagesData = await response.json();
    
    // Backend now returns THB prices directly, no transformation needed
    return NextResponse.json(packagesData);
  } catch (error) {
    console.error('Error in coin packages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 