import { NextRequest, NextResponse } from 'next/server';

// Ensure BACKEND_URL doesn't end with /api to avoid double /api/api
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

// GET - Fetch all gifts
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/monetization/gifts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch gifts from backend' }, { status: response.status });
    }

    const gifts = await response.json();
    return NextResponse.json(gifts);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new gift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, iconUrl, coinCost, isActive } = body;

    // Validate required fields
    if (!name || !iconUrl || coinCost === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/api/admin/monetization/gifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({
        name,
        description: description || '',
        iconUrl,
        coinCost: parseInt(coinCost),
        isActive: isActive !== undefined ? isActive : true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json({ error: errorData.message || 'Failed to create gift' }, { status: response.status });
      } catch {
        return NextResponse.json({ error: 'Failed to create gift' }, { status: response.status });
      }
    }

    const gift = await response.json();
    return NextResponse.json(gift, { status: 201 });
  } catch (error) {
    console.error('Error creating gift:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}