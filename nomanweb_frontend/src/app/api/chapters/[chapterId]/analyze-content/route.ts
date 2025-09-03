import { NextRequest, NextResponse } from "next/server";

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/api$/, "");

export async function POST(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No valid authorization header" },
        { status: 401 }
      );
    }

    const { chapterId } = params;

    console.log("[DEBUG] Authorization header:", authHeader);
    console.log("[DEBUG] Backend URL:", `${BACKEND_URL}/api/chapters/${chapterId}/analyze-content`);

    // Forward the request to the Spring Boot backend
    const response = await fetch(
      `${BACKEND_URL}/api/chapters/${chapterId}/analyze-content`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[DEBUG] Backend response status:", response.status);
    console.log("[DEBUG] Backend response headers:", Object.fromEntries(response.headers.entries()));

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Backend response is not JSON:", text);
      return NextResponse.json(
        { error: "Backend server error" },
        { status: 503 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to analyze chapter content" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chapter analyze content API error:", error);
    return NextResponse.json(
      { error: "Internal server error during content analysis" },
      { status: 500 }
    );
  }
}
