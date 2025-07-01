import { NextRequest, NextResponse } from 'next/server';
import { Liveblocks } from '@liveblocks/node';
import jwt from 'jsonwebtoken';

// Initialize Liveblocks with your secret key (you'll need to add this to your environment)
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || 'sk_dev_your_secret_key_here',
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Liveblocks auth endpoint called');
    
    // Check if Liveblocks secret is configured
    if (!process.env.LIVEBLOCKS_SECRET_KEY || process.env.LIVEBLOCKS_SECRET_KEY === 'sk_dev_your_secret_key_here') {
      console.error('❌ LIVEBLOCKS_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Liveblocks not configured' }, { status: 500 });
    }

    // Get the user from the request
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    console.log('🔍 Token extraction:', {
      hasCookieToken: !!request.cookies.get('token')?.value,
      hasAuthHeader: !!request.headers.get('authorization'),
      tokenLength: token?.length || 0
    });
    
    if (!token) {
      console.error('❌ No authentication token found');
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    // Verify the JWT token and extract user information
    let user;
    try {
      const jwtSecret = process.env.JWT_SECRET;
      console.log('🔍 JWT verification:', {
        hasJwtSecret: !!jwtSecret,
        jwtSecretLength: jwtSecret?.length || 0
      });
      
      if (!jwtSecret || jwtSecret === 'your-jwt-secret') {
        console.error('❌ JWT_SECRET not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Extract user information from JWT payload structure (sub, email, role)
      user = {
        id: decoded.sub, // User ID is stored in 'sub' field
        email: decoded.email,
        role: decoded.role,
        // Generate display name from email if not available
        username: decoded.email ? decoded.email.split('@')[0] : 'Anonymous',
        displayName: decoded.displayName || (decoded.email ? decoded.email.split('@')[0] : 'Anonymous')
      };
      
      console.log('✅ JWT verified successfully:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        hasDisplayName: !!user.displayName
      });
    } catch (error) {
      console.error('❌ JWT verification failed:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get the room from the request
    const { room } = await request.json();
    
    console.log('🔍 Room info:', { room });
    
    if (!room) {
      console.error('❌ No room provided');
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Validate user ID
    if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
      console.error('❌ Invalid user ID:', { userId: user.id, type: typeof user.id });
      return NextResponse.json({ error: 'Invalid user ID in token' }, { status: 401 });
    }

    // Extract chapter ID from room ID (format: "chapter:chapterId")
    const chapterId = room.replace('chapter:', '');
    console.log('🔍 Chapter access check:', { chapterId, userId: user.id });
    
    // Simplified access control for now - just allow authenticated users
    // You can implement proper authorization later
    const hasAccess = true; // Simplified for debugging
    
    if (!hasAccess) {
      console.error('❌ Access denied to chapter');
      return NextResponse.json({ error: 'Access denied to this chapter' }, { status: 403 });
    }

    // Create a session for the user
    console.log('🔍 Creating Liveblocks session with user ID:', user.id);
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        username: user.username || 'Anonymous',
        displayName: user.displayName || user.username || 'Anonymous',
        avatar: user.profileImageUrl || '',
        color: generateUserColor(),
      },
    });

    // Grant access to the specific room
    session.allow(room, session.FULL_ACCESS);

    // Authorize the user and return the result
    console.log('🔍 Authorizing session...');
    const { status, body } = await session.authorize();
    console.log('✅ Liveblocks session authorized successfully');
    return new Response(body, { status });

  } catch (error) {
    console.error('❌ Liveblocks auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// Note: Simplified authorization for debugging
// You can implement proper chapter access control later by:
// 1. Checking if user is the story author
// 2. Checking if user has collaboration permissions
// 3. Checking if user has purchased the chapter (for paid content)

// Utility function to generate user colors (same as in liveblocks.ts)
function generateUserColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#686DE0', '#4834D4', '#00C9FF', '#00FF84', '#FF006E'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
} 