import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    // Await params to fix Next.js 15 async params requirement
    const { storyId } = await params;

    // Get the user from the request
    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    // Verify the JWT token and extract user information
    let user;
    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret || jwtSecret === "your-jwt-secret") {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      const decoded = jwt.verify(token, jwtSecret) as any;

      user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');
    const backendUrl = `${BACKEND_URL}/api`;

    const response = await fetch(
      `${backendUrl}/stories/${storyId}/calculate-refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(await request.json()),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to calculate refund");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calculating refund:", error);
    return NextResponse.json(
      { error: "Failed to calculate refund" },
      { status: 500 }
    );
  }
}
