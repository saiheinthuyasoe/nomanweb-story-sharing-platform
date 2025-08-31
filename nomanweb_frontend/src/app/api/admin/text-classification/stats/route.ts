import { NextRequest, NextResponse } from 'next/server';

const MODEL_URL = process.env.LANGUAGE_DETECTION_MODEL_URL;
const STATS_URL = MODEL_URL?.replace('/predict', '/stats') || MODEL_URL;

export async function GET(request: NextRequest) {
  try {
    // Get admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Forward request to external model stats endpoint
    const response = await fetch(STATS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Model stats fetch failed:', errorText);
      return NextResponse.json(
        { error: 'Text classification model stats fetch failed' },
        { status: response.status }
      );
    }

    const statsData = await response.json();
    
    // Add our own metadata to the response
    const enhancedStatsData = {
      ...statsData,
      proxy_info: {
        model_url: MODEL_URL,
        proxy_timestamp: new Date().toISOString(),
        admin_request: true,
        endpoint: '/stats'
      }
    };

    console.log('Text classification stats retrieved:', {
      model_status: statsData.status || 'unknown',
      total_requests: statsData.total_requests || 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(enhancedStatsData);

  } catch (error) {
    console.error('Error in text classification stats API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        proxy_info: {
          model_url: MODEL_URL,
          proxy_timestamp: new Date().toISOString(),
          error: true
        }
      },
      { status: 500 }
    );
  }
}