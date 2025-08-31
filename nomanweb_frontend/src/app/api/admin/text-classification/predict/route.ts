import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Call language detection service
    const LANGUAGE_DETECTION_URL = process.env.LANGUAGE_DETECTION_MODEL_URL || 'https://arkar1431-language-detector.hf.space/predict';
    
    try {
      const aiResponse = await fetch(LANGUAGE_DETECTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!aiResponse.ok) {
        throw new Error(`Language detection service returned ${aiResponse.status}: ${aiResponse.statusText}`);
      }

      const aiResult = await aiResponse.json();
      
      // Validate AI response structure for language detection
      if (!aiResult.predicted_category || typeof aiResult.confidence !== 'number') {
        throw new Error('Invalid response format from language detection service');
      }

      const result = {
        predicted_category: aiResult.predicted_category,
        confidence: aiResult.confidence,
        top_categories: aiResult.top_categories || [],
        timestamp: new Date().toISOString(),
        text_length: text.length,
        word_count: text.split(/\s+/).length
      };

      return NextResponse.json(result);
    } catch (aiError) {
      console.error('AI classification service error:', aiError);
      return NextResponse.json(
        { 
          error: 'Language detection service unavailable',
          details: aiError instanceof Error ? aiError.message : 'Unknown error',
          service_url: LANGUAGE_DETECTION_URL
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Text classification error:', error);
    return NextResponse.json(
      { error: 'Classification failed' },
      { status: 500 }
    );
  }
}