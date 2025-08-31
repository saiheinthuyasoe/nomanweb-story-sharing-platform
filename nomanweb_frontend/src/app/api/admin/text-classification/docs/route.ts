import { NextRequest, NextResponse } from 'next/server';

const MODEL_URL = process.env.LANGUAGE_DETECTION_MODEL_URL;
const DOCS_URL = MODEL_URL?.replace('/predict', '/docs') || MODEL_URL;

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

    // Forward request to external model docs endpoint
    const response = await fetch(DOCS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If external docs not available, return our own documentation
      const fallbackDocs = {
        title: 'Text Classification API Documentation',
        version: '1.0.0',
        description: 'Language detection and content moderation API',
        model_info: {
          name: 'Language Detection Model',
          url: MODEL_URL,
          categories: [
            'normal',
            'offensive', 
            'hate_speech',
            'religious_hate',
            'political_hate'
          ],
          supported_languages: [
            'English',
            'Spanish',
            'French',
            'German',
            'Italian',
            'Portuguese',
            'Dutch',
            'Russian',
            'Chinese',
            'Japanese'
          ]
        },
        endpoints: {
          predict: {
            method: 'POST',
            path: '/predict',
            description: 'Classify a single text',
            parameters: {
              text: {
                type: 'string',
                required: true,
                description: 'Text to classify'
              }
            },
            response: {
              predicted_category: 'string',
              confidence: 'number',
              top_categories: 'array'
            }
          },
          batch_predict: {
            method: 'POST',
            path: '/batch_predict',
            description: 'Classify multiple texts',
            parameters: {
              texts: {
                type: 'array',
                required: true,
                description: 'Array of texts to classify'
              }
            }
          },
          health: {
            method: 'GET',
            path: '/health',
            description: 'Check model health status'
          },
          stats: {
            method: 'GET',
            path: '/stats',
            description: 'Get usage statistics'
          }
        },
        usage_examples: {
          single_prediction: {
            request: {
              text: 'This is a sample text to classify'
            },
            response: {
              predicted_category: 'normal',
              confidence: 0.95,
              top_categories: [
                { category: 'normal', confidence: 0.95 },
                { category: 'offensive', confidence: 0.03 }
              ]
            }
          }
        },
        proxy_info: {
          model_url: MODEL_URL,
          proxy_timestamp: new Date().toISOString(),
          fallback_docs: true
        }
      };

      return NextResponse.json(fallbackDocs);
    }

    const docsData = await response.json();
    
    // Add our own metadata to the response
    const enhancedDocsData = {
      ...docsData,
      proxy_info: {
        model_url: MODEL_URL,
        proxy_timestamp: new Date().toISOString(),
        admin_request: true,
        endpoint: '/docs'
      }
    };

    return NextResponse.json(enhancedDocsData);

  } catch (error) {
    console.error('Error in text classification docs API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        model_url: MODEL_URL,
        proxy_timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}