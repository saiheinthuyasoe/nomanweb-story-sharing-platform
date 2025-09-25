import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      // Check environment variables without exposing actual values
      hasLiveblocksSecret: !!process.env.LIVEBLOCKS_SECRET_KEY && process.env.LIVEBLOCKS_SECRET_KEY !== 'sk_dev_your_secret_key_here',
      liveblocksSecretLength: process.env.LIVEBLOCKS_SECRET_KEY?.length || 0,
      liveblocksSecretPrefix: process.env.LIVEBLOCKS_SECRET_KEY?.substring(0, 6) || 'none',
      
      hasJwtSecret: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-jwt-secret',
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      
      nodeEnv: process.env.NODE_ENV,
    },
    instructions: {
      step1: "Add LIVEBLOCKS_SECRET_KEY to your .env.local file",
      step2: "Add JWT_SECRET to your .env.local file (should match your existing auth system)",
      step3: "Restart your development server after adding environment variables"
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Test JWT token parsing without actually verifying
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    const body = await request.json().catch(() => ({}));
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      authTest: {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenType: token?.startsWith('ey') ? 'JWT-like' : 'unknown',
        hasRoomInBody: !!body.room,
        roomValue: body.room,
      },
      environment: {
        hasLiveblocksSecret: !!process.env.LIVEBLOCKS_SECRET_KEY && process.env.LIVEBLOCKS_SECRET_KEY !== 'sk_dev_your_secret_key_here',
        liveblocksSecretPrefix: process.env.LIVEBLOCKS_SECRET_KEY?.substring(0, 6) || 'none',
        hasJwtSecret: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-jwt-secret',
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 