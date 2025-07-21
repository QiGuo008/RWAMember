import { NextRequest, NextResponse } from 'next/server';
import { shareUserPlatform, getSharedMemberships } from '../../../lib/share-database';

// POST /api/share - Share a verified platform
export async function POST(request: NextRequest) {
  try {
    const { address, platform } = await request.json();

    if (!address || !platform) {
      return NextResponse.json({ error: 'Address and platform are required' }, { status: 400 });
    }

    const sharedMembership = await shareUserPlatform(address, platform);

    return NextResponse.json({ 
      message: 'Platform shared successfully',
      sharedMembership 
    });
  } catch (error) {
    console.error('Error sharing platform:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Platform not verified or not connected') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Platform already being shared') {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/share - Get shared memberships (marketplace)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const owner = searchParams.get('owner');

    const sharedMemberships = await getSharedMemberships(
      platform || undefined,
      owner || undefined
    );

    return NextResponse.json({ sharedMemberships });
  } catch (error) {
    console.error('Error fetching shared memberships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}