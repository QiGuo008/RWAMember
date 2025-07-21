import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// DELETE /api/share/[id] - Stop sharing a platform
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params;
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const membershipId = parseInt(id);
    
    // Find shared membership and verify ownership
    const sharedMembership = await prisma.sharedMembership.findFirst({
      where: {
        id: membershipId,
        owner: {
          address: address
        }
      }
    });

    if (!sharedMembership) {
      return NextResponse.json({ error: 'Shared membership not found' }, { status: 404 });
    }

    // Mark as inactive instead of deleting
    await prisma.sharedMembership.update({
      where: { id: membershipId },
      data: {
        isActive: false
      }
    });

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
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params;
    const { address, isActive } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const membershipId = parseInt(id);
    
    // Find shared membership and verify ownership
    const existingMembership = await prisma.sharedMembership.findFirst({
      where: {
        id: membershipId,
        owner: {
          address: address
        }
      }
    });

    if (!existingMembership) {
      return NextResponse.json({ error: 'Shared membership not found' }, { status: 404 });
    }

    // Update membership
    const updatedMembership = await prisma.sharedMembership.update({
      where: { id: membershipId },
      data: {
        ...(typeof isActive === 'boolean' && { isActive })
      },
      include: {
        owner: true,
        verification: {
          include: {
            platformStatus: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const status = updatedMembership.verification.platformStatus[0];

    return NextResponse.json({ 
      message: 'Shared membership updated successfully',
      sharedMembership: {
        id: updatedMembership.id,
        ownerId: updatedMembership.owner.address,
        platform: updatedMembership.platform,
        priceMon: Number(updatedMembership.priceMon),
        durationDays: updatedMembership.durationDays,
        isActive: updatedMembership.isActive,
        timesShared: updatedMembership.timesShared,
        maxShares: updatedMembership.maxShares,
        createdAt: updatedMembership.createdAt.toISOString(),
        updatedAt: updatedMembership.updatedAt.toISOString(),
        platformData: {
          platform: updatedMembership.verification.platform,
          vipStatus: status?.vipStatus || 'Unknown',
          expiryDate: status?.expiryDate?.toLocaleDateString() || 'Unknown'
        }
      }
    });
  } catch (error) {
    console.error('Error updating shared membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}