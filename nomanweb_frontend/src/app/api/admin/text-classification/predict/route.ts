import { NextRequest, NextResponse } from 'next/server';

// Performance optimizations
const MODEL_URL = process.env.LANGUAGE_DETECTION_MODEL_URL;
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_TEXT_LENGTH = 10000; // Limit text length for performance
const CACHE_TTL = 300000; // 5 minutes cache

// Simple in-memory cache for frequent predictions
const predictionCache = new Map<string, { result: any; timestamp: number }>();

// Request queue for handling high load
let requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 5;
let activeRequests = 0;

// Process request queue
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const request = requestQueue.shift();
    if (request) {
      activeRequests++;
      request().finally(() => {
        activeRequests--;
        processQueue(); // Process next in queue
      });
    }
  }
  
  isProcessingQueue = false;
}

// Clean expired cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of predictionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      predictionCache.delete(key);
    }
  }
}

// Generate cache key
function getCacheKey(text: string): string {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `predict_${hash}_${text.length}`;
}

// Optimized fetch with timeout and retry
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
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
    // Get admin token from Authorization header for consistency
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const { text, skipCache = false, metadata } = requestBody;

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Validate text length for performance
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long. Maximum length is ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cacheKey = getCacheKey(text);
      const cached = predictionCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return NextResponse.json({
          ...cached.result,
          cached: true,
          cache_timestamp: new Date(cached.timestamp).toISOString(),
          metadata: metadata || null,
          queue_position: 0,
          active_requests: activeRequests
        });
      }
    }

    // Clean cache periodically
    if (predictionCache.size > 1000) {
      cleanCache();
    }

    // Create prediction request
    const makePrediction = async () => {
      const startTime = Date.now();
      
      try {
        const aiResponse = await fetchWithTimeout(MODEL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ text })
        });

        if (!aiResponse.ok) {
          throw new Error(`Language detection service returned ${aiResponse.status}: ${aiResponse.statusText}`);
        }

        const aiResult = await aiResponse.json();
        
        // Validate AI response structure
        if (!aiResult.predicted_category || typeof aiResult.confidence !== 'number') {
          throw new Error('Invalid response format from language detection service');
        }

        const processingTime = Date.now() - startTime;
        
        const result = {
          predicted_category: aiResult.predicted_category,
          confidence: aiResult.confidence,
          top_categories: aiResult.top_categories || [],
          timestamp: new Date().toISOString(),
          text_length: text.length,
          word_count: text.split(/\s+/).length,
          processing_time_ms: processingTime,
          cached: false,
          metadata: metadata || null,
          queue_position: requestQueue.length,
          active_requests: activeRequests,
          service_url: MODEL_URL,
          raw_response: aiResult
        };

        // Cache the result
        if (!skipCache) {
          const cacheKey = getCacheKey(text);
          predictionCache.set(cacheKey, {
            result,
            timestamp: Date.now()
          });
        }

        return result;
      } catch (error) {
        throw error;
      }
    };

    // Handle high load with request queuing
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      return new Promise((resolve, reject) => {
        const queuedRequest = async () => {
          try {
            const result = await makePrediction();
            resolve(NextResponse.json(result));
          } catch (error) {
            reject(error);
          }
        };
        
        requestQueue.push(queuedRequest);
        processQueue();
      });
    } else {
      const result = await makePrediction();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Text classification error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            details: 'The prediction request took too long to complete',
            timeout_ms: REQUEST_TIMEOUT
          },
          { status: 408 }
        );
      }
      
      if (error.message.includes('Language detection service')) {
        // Provide fallback response when external service is unavailable
        return NextResponse.json(
          { 
            predicted_category: 'unknown',
            confidence: 0,
            top_categories: [{ category: 'unknown', confidence: 0 }],
            timestamp: new Date().toISOString(),
            text_length: text.length,
            word_count: text.split(/\s+/).length,
            processing_time_ms: 0,
            cached: false,
            metadata: metadata || null,
            queue_position: 0,
            active_requests: activeRequests,
            service_url: MODEL_URL,
            error: 'Language detection service unavailable',
            details: error.message,
            fallback_mode: true
          },
          { status: 200 } // Return 200 with fallback data instead of 503 error
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Classification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}