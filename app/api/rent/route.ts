import { NextRequest, NextResponse } from 'next/server';
import { sharedMemberships, membershipRentals, MembershipRental } from '../share/route';

// POST /api/rent - Rent a shared membership
export async function POST(request: NextRequest) {
  try {
    const { sharedMembershipId, renterAddress, transactionHash } = await request.json();

    if (!sharedMembershipId || !renterAddress) {
      return NextResponse.json({ 
        error: 'Shared membership ID and renter address are required' 
      }, { status: 400 });
    }

    // Find the shared membership
    const sharedMembership = sharedMemberships.find(s => s.id === sharedMembershipId && s.isActive);
    
    if (!sharedMembership) {
      return NextResponse.json({ error: 'Shared membership not found or inactive' }, { status: 404 });
    }

    // Check if user is trying to rent their own membership
    if (sharedMembership.ownerId === renterAddress) {
      return NextResponse.json({ error: 'Cannot rent your own membership' }, { status: 400 });
    }

    // Check if max shares reached
    const activeRentals = membershipRentals.filter(
      r => r.sharedMembershipId === sharedMembershipId && r.status === 'active'
    );

    if (activeRentals.length >= sharedMembership.maxShares) {
      return NextResponse.json({ error: 'Maximum shares reached for this membership' }, { status: 409 });
    }

    // Calculate expiry date
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + sharedMembership.durationDays * 24 * 60 * 60 * 1000);

    // Create rental record
    const rental: MembershipRental = {
      id: `rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sharedMembershipId,
      renterId: renterAddress, // This would be the user ID in a real app
      renterAddress,
      pricePaid: sharedMembership.priceMon,
      durationDays: sharedMembership.durationDays,
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      transactionHash,
      createdAt: new Date().toISOString()
    };

    membershipRentals.push(rental);

    // Update shared membership stats
    const shareIndex = sharedMemberships.findIndex(s => s.id === sharedMembershipId);
    if (shareIndex >= 0) {
      sharedMemberships[shareIndex].timesShared += 1;
      sharedMemberships[shareIndex].updatedAt = new Date().toISOString();
    }

    return NextResponse.json({ 
      message: 'Membership rented successfully',
      rental,
      sharedMembership
    });
  } catch (error) {
    console.error('Error renting membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/rent - Get user's rentals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const renterAddress = searchParams.get('address');

    if (!renterAddress) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    const userRentals = membershipRentals.filter(r => r.renterAddress === renterAddress);

    // Sort by creation date (newest first)
    userRentals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Add shared membership details to each rental
    const detailedRentals = userRentals.map(rental => {
      const sharedMembership = sharedMemberships.find(s => s.id === rental.sharedMembershipId);
      return {
        ...rental,
        sharedMembership
      };
    });

    return NextResponse.json({ rentals: detailedRentals });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}