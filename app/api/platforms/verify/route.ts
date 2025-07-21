import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { savePlatformVerification } from '../../lib/mock-database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string; timestamp: number; };
    
    if (!decoded.address) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { platform, attestation, verificationData } = await request.json();

    if (!platform || !attestation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const address = decoded.address;

    // Save platform verification using shared database
    savePlatformVerification(address, platform, attestation, verificationData);

    return NextResponse.json({ 
      success: true,
      message: `${platform} verification saved successfully`,
    });
  } catch (error) {
    console.error('Platform verification save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}