import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// For server-side Primus SDK (you'll need to implement this based on your needs)
// const { PrimusZKTLS } = require('@primuslabs/zktls-core-sdk');

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

    const { signParams } = await request.json();

    if (!signParams) {
      return NextResponse.json({ error: 'Missing signParams' }, { status: 400 });
    }

    // In production, you would use the Primus Core SDK here
    // For now, we'll return the signed params (this is a mock implementation)
    // const primusZKTLS = new PrimusZKTLS();
    // await primusZKTLS.init(appId, appSecret);
    // const signResult = await primusZKTLS.sign(signParams);

    // Mock implementation - you need to replace this with actual Primus Core SDK usage
    const mockSignResult = JSON.stringify({
      ...JSON.parse(signParams),
      signature: 'mock-signature',
      timestamp: Date.now(),
    });

    return NextResponse.json({ 
      signResult: mockSignResult 
    });
  } catch (error) {
    console.error('Primus sign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}