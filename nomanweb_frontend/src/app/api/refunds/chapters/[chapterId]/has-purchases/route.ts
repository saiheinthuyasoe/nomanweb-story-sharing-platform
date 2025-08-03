import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    // Await params to fix Next.js 15 async params requirement
    const { chapterId } = await params;

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

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/refunds/chapters/${chapterId}/has-purchases`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check chapter purchases");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking chapter purchases:", error);
    return NextResponse.json(
      { error: "Failed to check chapter purchases" },
      { status: 500 }
    );
  }
}
