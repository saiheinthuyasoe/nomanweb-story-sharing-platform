import { NextRequest, NextResponse } from 'next/server';

const MODEL_URL = process.env.LANGUAGE_DETECTION_MODEL_URL || 'https://arkar1431-language-detector.hf.space';

export async function POST(request: NextRequest) {
  try {
    // Get admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestBody = await request.json();
    
    // Validate required fields
    if (!requestBody.texts || !Array.isArray(requestBody.texts)) {
      return NextResponse.json(
        { error: 'Texts field is required and must be an array' },
        { status: 400 }
      );
    }

    // Validate each text in the array
    const invalidTexts = requestBody.texts.filter((text: any) => !text || typeof text !== 'string');
    if (invalidTexts.length > 0) {
      return NextResponse.json(
        { error: 'All texts must be non-empty strings' },
        { status: 400 }
      );
    }

    // Add metadata for tracking
    const enhancedRequestBody = {
      ...requestBody,
      metadata: {
        ...requestBody.metadata,
        admin_request: true,
        proxy_timestamp: new Date().toISOString(),
        source: 'admin_dashboard',
        batch_size: requestBody.texts.length
      }
    };

    console.log('Batch text classification request:', {
      batch_size: requestBody.texts.length,
      total_chars: requestBody.texts.reduce((sum: number, text: string) => sum + text.length, 0),
      has_metadata: !!requestBody.metadata,
      timestamp: new Date().toISOString()
    });

    // Forward request to external model batch predict endpoint
    const response = await fetch(`${MODEL_URL}/batch_predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Model batch prediction failed:', errorText);
      return NextResponse.json(
        { error: 'Text classification batch prediction failed' },
        { status: response.status }
      );
    }

    const batchPredictionData = await response.json();
    
    // Add our own metadata to the response
    const enhancedBatchPredictionData = {
      ...batchPredictionData,
      proxy_info: {
        model_url: MODEL_URL,
        proxy_timestamp: new Date().toISOString(),
        admin_request: true,
        batch_size: requestBody.texts.length
      }
    };

    console.log('Batch text classification response:', {
      batch_size: requestBody.texts.length,
      predictions_count: batchPredictionData.predictions?.length || 0,
      total_processing_time_ms: batchPredictionData.total_processing_time_ms,
      average_confidence: batchPredictionData.average_confidence
    });

    return NextResponse.json(enhancedBatchPredictionData);

  } catch (error) {
    console.error('Error in text classification batch predict API:', error);
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