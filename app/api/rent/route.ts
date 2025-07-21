import { NextRequest, NextResponse } from 'next/server';
import { createRental, getUserRentals } from '../../../lib/rental-database';

// POST /api/rent - Rent a shared membership
export async function POST(request: NextRequest) {
  try {
    const { sharedMembershipId, renterAddress, transactionHash } = await request.json();

    if (!sharedMembershipId || !renterAddress || !transactionHash) {
      return NextResponse.json({ 
        error: 'Shared membership ID, renter address, and transaction hash are required' 
      }, { status: 400 });
    }

    const result = await createRental(sharedMembershipId, renterAddress, transactionHash);

    return NextResponse.json({ 
      message: 'Membership rented successfully',
      ...result
    });
  } catch (error) {
    console.error('Error renting membership:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Shared membership not found or inactive') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Cannot rent your own membership') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Maximum shares reached for this membership') {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message === 'Transaction hash is required') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Transaction has already been used') {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.startsWith('Transaction verification failed')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Transaction sender does not match renter address') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Admin address not configured') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    
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

    const rentals = await getUserRentals(renterAddress);

    return NextResponse.json({ rentals });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}