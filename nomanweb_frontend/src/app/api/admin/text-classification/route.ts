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

    // Return information about available endpoints
    const endpointsInfo = {
      service: 'Text Classification API',
      model_url: MODEL_URL,
      version: '1.0.0',
      description: 'Admin proxy endpoints for text classification and content moderation',
      endpoints: {
        health: {
          path: '/api/admin/text-classification/health',
          method: 'GET',
          description: 'Check model health status',
          example_response: {
            status: 'healthy',
            model_loaded: true,
            tokenizer_loaded: true,
            total_requests: 1247,
            cpu_percent: 23.4,
            memory_percent: 67.8
          }
        },
        predict: {
          path: '/api/admin/text-classification/predict',
          method: 'POST',
          description: 'Classify a single text',
          request_body: {
            text: 'string (required)',
            metadata: 'object (optional)'
          },
          example_request: {
            text: 'I really hate when people are rude to others. It makes me so angry!'
          },
          example_response: {
            text: 'I really hate when people are rude to others. It makes me so angry!',
            predicted_category: 'offensive',
            confidence: 0.7234,
            all_probabilities: {
              normal: 0.1456,
              offensive: 0.7234,
              hate_speech: 0.0987,
              religious_hate: 0.0234,
              political_hate: 0.0089
            },
            sentence_count: 2,
            text_length: 72,
            processing_time_ms: 94.7
          }
        },
        batch_predict: {
          path: '/api/admin/text-classification/batch-predict',
          method: 'POST',
          description: 'Classify multiple texts in a single request',
          request_body: {
            texts: 'array of strings (required)',
            metadata: 'object (optional)'
          },
          example_request: {
            texts: [
              'This is a normal comment.',
              'I hate this so much!',
              'Great work everyone!'
            ]
          }
        },
        stats: {
          path: '/api/admin/text-classification/stats',
          method: 'GET',
          description: 'Get model usage statistics'
        },
        docs: {
          path: '/api/admin/text-classification/docs',
          method: 'GET',
          description: 'Get model documentation'
        }
      },
      categories: {
        normal: 'Regular, non-offensive content',
        offensive: 'Contains offensive language or tone',
        hate_speech: 'Contains hate speech',
        religious_hate: 'Contains religious hate speech',
        political_hate: 'Contains political hate speech'
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <admin_jwt_token>',
        required: true
      },
      usage_notes: [
        'All endpoints require admin authentication',
        'Text should be non-empty string',
        'Batch predict accepts arrays of texts',
        'Confidence scores range from 0 to 1',
        'Processing time varies by text length'
      ],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(endpointsInfo);

  } catch (error) {
    console.error('Error in text classification info API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        service: 'Text Classification API',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}