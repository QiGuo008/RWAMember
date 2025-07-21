import { NextRequest, NextResponse } from 'next/server';
import { mockDatabase, PlatformData } from '../lib/mock-database';

// Mock shared memberships database
export interface SharedMembership {
  id: string;
  ownerId: string;
  platform: string;
  priceMon: number;
  durationDays: number;
  isActive: boolean;
  timesShared: number;
  maxShares: number;
  createdAt: string;
  updatedAt: string;
  platformData: PlatformData;
}

export interface MembershipRental {
  id: string;
  sharedMembershipId: string;
  renterId: string;
  renterAddress: string;
  pricePaid: number;
  durationDays: number;
  startsAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'cancelled';
  transactionHash?: string;
  createdAt: string;
}

// Mock databases
export const sharedMemberships: SharedMembership[] = [];
export const membershipRentals: MembershipRental[] = [];

// POST /api/share - Share a verified platform
export async function POST(request: NextRequest) {
  try {
    const { address, platform } = await request.json();

    if (!address || !platform) {
      return NextResponse.json({ error: 'Address and platform are required' }, { status: 400 });
    }

    // Check if user has verified this platform
    const userPlatforms = mockDatabase[address] || [];
    const platformData = userPlatforms.find(p => p.platform === platform && p.isConnected);

    if (!platformData) {
      return NextResponse.json({ error: 'Platform not verified or not connected' }, { status: 404 });
    }

    // Check if already sharing this platform
    const existingShare = sharedMemberships.find(
      s => s.ownerId === address && s.platform === platform && s.isActive
    );

    if (existingShare) {
      return NextResponse.json({ error: 'Platform already being shared' }, { status: 409 });
    }

    // Create new shared membership
    const sharedMembership: SharedMembership = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerId: address,
      platform,
      priceMon: 0.1, // Fixed price
      durationDays: 1, // Fixed duration
      isActive: true,
      timesShared: 0,
      maxShares: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      platformData
    };

    sharedMemberships.push(sharedMembership);

    return NextResponse.json({ 
      message: 'Platform shared successfully',
      sharedMembership 
    });
  } catch (error) {
    console.error('Error sharing platform:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/share - Get shared memberships (marketplace)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const owner = searchParams.get('owner');

    let filteredShares = sharedMemberships.filter(s => s.isActive);

    if (platform) {
      filteredShares = filteredShares.filter(s => s.platform === platform);
    }

    if (owner) {
      filteredShares = filteredShares.filter(s => s.ownerId === owner);
    }

    // Sort by creation date (newest first)
    filteredShares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ sharedMemberships: filteredShares });
  } catch (error) {
    console.error('Error fetching shared memberships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}