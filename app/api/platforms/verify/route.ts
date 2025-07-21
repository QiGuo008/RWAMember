import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock database - in production, use PostgreSQL
const mockDatabase: { [address: string]: PlatformData[] } = {};

interface PlatformData {
  platform: string;
  isConnected: boolean;
  data: string;
  attestation: any;
  verifiedAt: string;
}

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

    // Initialize user data if doesn't exist
    if (!mockDatabase[address]) {
      mockDatabase[address] = [];
    }

    // Find existing platform verification or create new one
    const existingIndex = mockDatabase[address].findIndex(p => p.platform === platform);
    
    const platformData = {
      platform,
      isConnected: true,
      data: verificationData,
      attestation,
      verifiedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      mockDatabase[address][existingIndex] = platformData;
    } else {
      mockDatabase[address].push(platformData);
    }

    return NextResponse.json({ 
      success: true,
      message: `${platform} verification saved successfully`,
    });
  } catch (error) {
    console.error('Platform verification save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}