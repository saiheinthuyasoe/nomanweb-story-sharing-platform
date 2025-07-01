import { NextRequest, NextResponse } from 'next/server';
import { broadcastCoinPackageUpdate } from '@/lib/broadcast';

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

    const adminToken = authHeader.substring(7);

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/admin/coins/packages`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Failed to fetch coin packages' },
        { status: response.status }
      );
    }

    const packagesData = await response.json();
    return NextResponse.json(packagesData);
  } catch (error) {
    console.error('Error in admin coin packages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
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

    const adminToken = authHeader.substring(7);
    const packageData = await request.json();

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/admin/coins/packages`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packageData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Failed to create coin package' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    console.log('🎯 About to broadcast PACKAGE_CREATED:', result);
    // Broadcast the new package to all connected clients (use result.package, not result)
    broadcastCoinPackageUpdate('PACKAGE_CREATED', { package: result.package || result });
    console.log('✅ Broadcast PACKAGE_CREATED completed');
    
    // Add debug info to response
    return NextResponse.json({
      ...result,
      __debug: {
        broadcastSent: true,
        route: 'packages/route.ts',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error in admin coin package creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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
    const { id, ...updateData } = packageData;

    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required for update' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/admin/coins/packages/${id}`;
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: errorData || 'Failed to update coin package' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    console.log('🎯 About to broadcast PACKAGE_UPDATED:', result);
    // Broadcast the updated package to all connected clients (use result.package, not result)
    broadcastCoinPackageUpdate('PACKAGE_UPDATED', { package: result.package || result });
    console.log('✅ Broadcast PACKAGE_UPDATED completed');
    
    // Add debug info to response
    return NextResponse.json({
      ...result,
      __debug: {
        broadcastSent: true,
        route: 'packages/route.ts',
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

export async function DELETE(request: NextRequest) {
  try {
    // Get admin token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const adminToken = authHeader.substring(7);
    const url = new URL(request.url);
    const packageId = url.searchParams.get('id');

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/admin/coins/packages/${packageId}`;
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

    console.log('🎯 About to broadcast PACKAGE_DELETED for ID:', packageId);
    // Broadcast the package deletion to all connected clients
    broadcastCoinPackageUpdate('PACKAGE_DELETED', { packageId: packageId });
    console.log('✅ Broadcast PACKAGE_DELETED completed');
    
    return NextResponse.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error in admin coin package deletion API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 