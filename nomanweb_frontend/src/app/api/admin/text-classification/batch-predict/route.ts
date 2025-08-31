import { NextRequest, NextResponse } from 'next/server';

const MODEL_URL = process.env.LANGUAGE_DETECTION_MODEL_URL;
const REQUEST_TIMEOUT = 30000; // 30 seconds for batch requests
const MAX_BATCH_SIZE = 100; // Limit batch size for performance
const MAX_TEXT_LENGTH = 10000; // Limit individual text length

// Batch request queue for handling high load
let batchRequestQueue: Array<() => Promise<any>> = [];
let isBatchProcessing = false;
const MAX_CONCURRENT_BATCH_REQUESTS = 2;
let activeBatchRequests = 0;

// Process batch request queue
async function processBatchQueue() {
  if (isBatchProcessing || batchRequestQueue.length === 0 || activeBatchRequests >= MAX_CONCURRENT_BATCH_REQUESTS) {
    return;
  }
  
  isBatchProcessing = true;
  
  while (batchRequestQueue.length > 0 && activeBatchRequests < MAX_CONCURRENT_BATCH_REQUESTS) {
    const request = batchRequestQueue.shift();
    if (request) {
      activeBatchRequests++;
      request().finally(() => {
        activeBatchRequests--;
        processBatchQueue();
      });
    }
  }
  
  isBatchProcessing = false;
}

// Optimized fetch with timeout for batch requests
async function fetchBatchWithTimeout(url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

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

    // Validate batch size
    if (requestBody.texts.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size too large. Maximum batch size is ${MAX_BATCH_SIZE}` },
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

    // Validate text lengths
    const tooLongTexts = requestBody.texts.filter((text: string) => text.length > MAX_TEXT_LENGTH);
    if (tooLongTexts.length > 0) {
      return NextResponse.json(
        { error: `Some texts are too long. Maximum length per text is ${MAX_TEXT_LENGTH} characters` },
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

    const startTime = Date.now();
    const totalChars = requestBody.texts.reduce((sum: number, text: string) => sum + text.length, 0);
    
    console.log('Batch text classification request:', {
      batch_size: requestBody.texts.length,
      total_chars: totalChars,
      avg_text_length: Math.round(totalChars / requestBody.texts.length),
      has_metadata: !!requestBody.metadata,
      timestamp: new Date().toISOString()
    });

    // Create batch prediction request
    const makeBatchPrediction = async () => {
      try {
        const response = await fetchBatchWithTimeout(`${MODEL_URL}/batch_predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(enhancedRequestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Model batch prediction failed:', errorText);
          throw new Error(`Batch prediction service returned ${response.status}: ${response.statusText}`);
        }

        const batchPredictionData = await response.json();
        const processingTime = Date.now() - startTime;
        
        // Add performance metrics and metadata
        const enhancedBatchPredictionData = {
          ...batchPredictionData,
          performance_metrics: {
            total_processing_time_ms: processingTime,
            avg_processing_time_per_text_ms: Math.round(processingTime / requestBody.texts.length),
            texts_processed: requestBody.texts.length,
            total_characters: totalChars,
            throughput_chars_per_second: Math.round(totalChars / (processingTime / 1000))
          },
          proxy_info: {
            model_url: MODEL_URL,
            proxy_timestamp: new Date().toISOString(),
            admin_request: true,
            endpoint: '/batch_predict',
            queue_position: activeBatchRequests
          }
        };

        console.log('Batch prediction completed:', {
          batch_size: requestBody.texts.length,
          processing_time_ms: processingTime,
          success: true,
          timestamp: new Date().toISOString()
        });

        return enhancedBatchPredictionData;
      } catch (error) {
        console.error('Batch prediction error:', error);
        throw error;
      }
    };

    // Handle high load with request queuing
    if (activeBatchRequests >= MAX_CONCURRENT_BATCH_REQUESTS) {
      return new Promise((resolve, reject) => {
        const queuedRequest = async () => {
          try {
            const result = await makeBatchPrediction();
            resolve(NextResponse.json(result));
          } catch (error) {
            reject(error);
          }
        };
        
        batchRequestQueue.push(queuedRequest);
        processBatchQueue();
      });
    } else {
      const result = await makeBatchPrediction();
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Error in batch text classification API:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Batch request timeout',
            details: 'The batch prediction request took too long to complete',
            timeout_ms: REQUEST_TIMEOUT,
            batch_size: requestBody?.texts?.length || 0
          },
          { status: 408 }
        );
      }
      
      if (error.message.includes('Batch prediction service')) {
        return NextResponse.json(
          { 
            error: 'Batch prediction service unavailable',
            details: error.message,
            service_url: MODEL_URL,
            timestamp: new Date().toISOString()
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Batch classification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        model_url: MODEL_URL,
        proxy_timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}