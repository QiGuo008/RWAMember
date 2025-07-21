import { NextRequest, NextResponse } from 'next/server';
import { sharedMemberships } from '../route';

// DELETE /api/share/[id] - Stop sharing a platform
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const shareIndex = sharedMemberships.findIndex(
      s => s.id === id && s.ownerId === address
    );

    if (shareIndex === -1) {
      return NextResponse.json({ error: 'Shared membership not found' }, { status: 404 });
    }

    // Mark as inactive instead of deleting
    sharedMemberships[shareIndex].isActive = false;
    sharedMemberships[shareIndex].updatedAt = new Date().toISOString();

    return NextResponse.json({ 
      message: 'Stopped sharing platform successfully' 
    });
  } catch (error) {
    console.error('Error stopping share:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/share/[id] - Update shared membership
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { address, isActive } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const shareIndex = sharedMemberships.findIndex(
      s => s.id === id && s.ownerId === address
    );

    if (shareIndex === -1) {
      return NextResponse.json({ error: 'Shared membership not found' }, { status: 404 });
    }

    // Update membership
    if (typeof isActive === 'boolean') {
      sharedMemberships[shareIndex].isActive = isActive;
    }
    sharedMemberships[shareIndex].updatedAt = new Date().toISOString();

    return NextResponse.json({ 
      message: 'Shared membership updated successfully',
      sharedMembership: sharedMemberships[shareIndex]
    });
  } catch (error) {
    console.error('Error updating shared membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}