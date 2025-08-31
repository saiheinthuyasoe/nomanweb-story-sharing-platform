import { NextRequest, NextResponse } from 'next/server';

const MODEL_URL = process.env.LANGUAGE_DETECTION_MODEL_URL;
const HEALTH_URL = MODEL_URL?.replace('/predict', '/health') || MODEL_URL;
const HEALTH_CHECK_TIMEOUT = 8000; // 8 seconds

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

    const startTime = Date.now();
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
      
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('Model health check failed:', errorText);
        
        return NextResponse.json({
          status: 'unhealthy',
          error: 'Text classification model health check failed',
          details: errorText,
          model_url: MODEL_URL,
          response_time_ms: responseTime,
          response_code: response.status,
          proxy_status: 'degraded',
          proxy_timestamp: new Date().toISOString()
        });
      }

      const healthData = await response.json().catch(() => ({ status: 'unknown' }));
      
      // Add our own timestamp and endpoint info
      const enhancedHealthData = {
        ...healthData,
        model_url: MODEL_URL,
        response_time_ms: responseTime,
        proxy_timestamp: new Date().toISOString(),
        proxy_status: 'operational'
      };

      return NextResponse.json(enhancedHealthData);
    } catch (fetchError) {
      const responseTime = Date.now() - startTime;
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({
          status: 'unhealthy',
          error: 'Health check timeout',
          details: `Request timed out after ${HEALTH_CHECK_TIMEOUT}ms`,
          model_url: MODEL_URL,
          response_time_ms: responseTime,
          proxy_status: 'timeout',
          proxy_timestamp: new Date().toISOString()
        });
      }
      
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Unable to reach text classification service',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown connection error',
        model_url: MODEL_URL,
        response_time_ms: responseTime,
        proxy_status: 'unreachable',
        proxy_timestamp: new Date().toISOString()
      });
    }

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