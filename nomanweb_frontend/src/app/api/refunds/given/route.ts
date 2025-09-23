import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
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

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "0";
    const size = searchParams.get("size") || "20";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');
    const backendUrl = `${BACKEND_URL}/api`;
    let url = `${backendUrl}/refunds/given?page=${page}&size=${size}`;

    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch given refunds");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching given refunds:", error);
    return NextResponse.json(
      { error: "Failed to fetch given refunds" },
      { status: 500 }
    );
  }
}
