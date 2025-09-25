import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header from request (optional for this public endpoint)
    const authHeader = request.headers.get('authorization');
    
    // Forward request to backend
    const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');
    const backendUrl = `${BACKEND_URL}/api`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add authorization header if present (but it's not required for this public endpoint)
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${backendUrl}/coins/packages`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || "Failed to fetch coin packages" },
        { status: response.status }
      );
    }

    const packagesData = await response.json();

    // Backend now returns THB prices directly, no transformation needed
    return NextResponse.json(packagesData);
  } catch (error) {
    console.error("Error in coin packages API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
