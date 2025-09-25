import { NextRequest, NextResponse } from 'next/server';
import { broadcastCoinPackageUpdate } from '@/lib/broadcast';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test broadcast endpoint called');
    
    // Send a test message
    broadcastCoinPackageUpdate('TEST_MESSAGE', { 
      message: 'This is a test broadcast', 
      timestamp: Date.now() 
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test broadcast sent' 
    });
  } catch (error) {
    console.error('Error in test broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to send test broadcast' },
      { status: 500 }
    );
  }
} 