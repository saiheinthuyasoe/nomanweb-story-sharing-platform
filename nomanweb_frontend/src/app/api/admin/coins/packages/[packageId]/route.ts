import { NextRequest, NextResponse } from 'next/server';
import { broadcastCoinPackageUpdate } from '@/lib/broadcast';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api$/, '');

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    
    // Get admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const adminToken = authHeader.substring(7);
    const packageData = await request.json();

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/api/admin/coins/packages/${packageId}`;
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packageData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Failed to update coin package' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    console.log('🎯 About to broadcast PACKAGE_UPDATED from [packageId] route:', result);
    // Broadcast the updated package to all connected clients (use result.package, not result)
    broadcastCoinPackageUpdate('PACKAGE_UPDATED', { package: result.package || result });
    console.log('✅ Broadcast PACKAGE_UPDATED from [packageId] route completed');
    
    // Add debug info to response
    return NextResponse.json({
      ...result,
      __debug: {
        broadcastSent: true,
        route: '[packageId]/route.ts',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error in admin coin package update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    
    // Get admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const adminToken = authHeader.substring(7);

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/api/admin/coins/packages/${packageId}`;
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Failed to delete coin package' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    console.log('🎯 About to broadcast PACKAGE_DELETED from [packageId] route for ID:', packageId);
    // Broadcast the package deletion to all connected clients
    broadcastCoinPackageUpdate('PACKAGE_DELETED', { packageId: packageId });
    console.log('✅ Broadcast PACKAGE_DELETED from [packageId] route completed');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in admin coin package deletion API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}