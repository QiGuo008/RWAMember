import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserPlatforms } from '../../lib/mock-database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
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

    const address = decoded.address;
    const platforms = getUserPlatforms(address);

    return NextResponse.json({ 
      platforms,
      address 
    });
  } catch (error) {
    console.error('Platform status fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}