import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');
    const backendUrl = `${BACKEND_URL}/api`;
    const response = await fetch(
      `${backendUrl}/refunds/test`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error testing refund controller:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to refund controller",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
