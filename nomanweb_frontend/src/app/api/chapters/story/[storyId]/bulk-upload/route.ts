import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Helper function to convert file content to HTML
// Note: For .doc, .docx, .pdf, .odt files, this is a basic implementation
// In production, consider using libraries like mammoth (for docx) or pdf-parse (for pdf)
async function convertToHTML(file: File): Promise<string> {
  const text = await file.text();
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "html":
    case "htm":
      return text;

    case "md":
    case "markdown":
      // Basic markdown to HTML conversion
      return convertMarkdownToHTML(text);

    case "rtf":
      // Basic RTF to HTML conversion (remove RTF formatting)
      return convertRTFToHTML(text);

    case "txt":
    default:
      // Convert plain text to HTML with line breaks
      return convertPlainTextToHTML(text);
  }
}

function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>");
  html = html.replace(/\*(.*)\*/gim, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n\n/gim, "</p><p>");
  html = html.replace(/\n/gim, "<br>");

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  return html;
}

function convertPlainTextToHTML(text: string): string {
  // Escape HTML characters
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Convert line breaks to HTML
  const withBreaks = escaped.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");

  // Wrap in paragraphs
  return `<p>${withBreaks}</p>`;
}

function convertRTFToHTML(rtf: string): string {
  // Basic RTF to HTML conversion - remove RTF control codes and formatting
  let text = rtf;

  // Remove RTF header and control words
  text = text.replace(/\\rtf\d+/g, "");
  text = text.replace(/\\[a-zA-Z]+\d*\s?/g, "");
  text = text.replace(/[{}]/g, "");
  text = text.replace(/\\\\/g, "\\");
  text = text.replace(/\\'/g, "'");

  // Clean up extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Convert to HTML
  return convertPlainTextToHTML(text);
}

function generateChapterTitle(filename: string): string {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Convert underscores and hyphens to spaces
  const withSpaces = nameWithoutExt.replace(/[_-]/g, " ");

  // Capitalize words
  const capitalized = withSpaces.replace(/\b\w/g, (l) => l.toUpperCase());

  return capitalized || "Untitled Chapter";
}

function calculateWordCount(htmlContent: string): number {
  // Remove HTML tags and count words
  const textContent = htmlContent.replace(/<[^>]*>/g, " ");
  const words = textContent
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.length;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    // Get authentication token from Authorization header (preferred) or cookie
    let token: string | undefined;

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedExtensions = [
      "txt",
      "doc",
      "docx",
      "pdf",
      "rtf",
      "odt",
      "html",
      "htm",
      "md",
      "markdown",
    ];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${allowedExtensions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    try {
      // Convert file content to HTML
      const htmlContent = await convertToHTML(file);

      // Generate chapter title from filename
      const chapterTitle = generateChapterTitle(file.name);

      // Calculate word count
      const wordCount = calculateWordCount(htmlContent);

      // Create chapter via backend API
      const BACKEND_URL = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      ).replace(/\/api$/, "");
      const backendResponse = await fetch(`${BACKEND_URL}/api/chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storyId: storyId,
          title: chapterTitle,
          content: htmlContent,
          chapterNumber: null, // Let backend auto-assign
          coinPrice: 0,
          isFree: true,
          isDraft: true, // Always save as draft
          wordCount: wordCount,
        }),
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error("Backend error:", errorText);
        return NextResponse.json(
          { error: "Failed to create chapter" },
          { status: backendResponse.status }
        );
      }

      const createdChapter = await backendResponse.json();

      return NextResponse.json({
        success: true,
        message: "Chapter uploaded successfully",
        chapterId: createdChapter.id,
        title: createdChapter.title,
        wordCount: createdChapter.wordCount,
        filename: file.name,
      });
    } catch (conversionError) {
      console.error("File conversion error:", conversionError);
      return NextResponse.json(
        { error: "Failed to process file content" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
