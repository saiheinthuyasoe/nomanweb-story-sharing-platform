import { NextRequest, NextResponse } from 'next/server';

const MODEL_URL = process.env.LANGUAGE_DETECTION_MODEL_URL || 'https://arkar1431-language-detector.hf.space';

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

    // Forward request to external model health endpoint
    const response = await fetch(`${MODEL_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Model health check failed:', errorText);
      return NextResponse.json(
        { error: 'Text classification model health check failed' },
        { status: response.status }
      );
    }

    const healthData = await response.json();
    
    // Add our own timestamp and endpoint info
    const enhancedHealthData = {
      ...healthData,
      model_url: MODEL_URL,
      proxy_timestamp: new Date().toISOString(),
      proxy_status: 'operational'
    };

    return NextResponse.json(enhancedHealthData);

  } catch (error) {
    console.error('Error in text classification health API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        model_url: MODEL_URL,
        proxy_status: 'error',
        proxy_timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}