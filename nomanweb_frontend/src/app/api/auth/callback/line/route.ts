import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // LINE is redirecting to the wrong URL, so we'll redirect to the correct one
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  // Construct the correct callback URL with the parameters
  const correctCallbackUrl = new URL('/auth/line/callback', request.url);
  if (code) correctCallbackUrl.searchParams.set('code', code);
  if (state) correctCallbackUrl.searchParams.set('state', state);
  
  // Redirect to the correct callback page
  return NextResponse.redirect(correctCallbackUrl);
} 