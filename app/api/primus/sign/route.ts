import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Import Primus Core SDK for server-side signing
const { PrimusZKTLS } = require('@primuslabs/zktls-js-sdk');

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

    // Use the actual Primus Core SDK for signing
    const appId = process.env.NEXT_PUBLIC_PRIMUS_APP_ID;
    const appSecret = process.env.PRIMUS_APP_SECRET;

    if (!appId || !appSecret) {
      console.error('Missing Primus configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Initialize Primus SDK with app secret for server-side signing
    const primusZKTLS = new PrimusZKTLS();
    await primusZKTLS.init(appId, appSecret);
    
    // Sign the request parameters
    const signResult = await primusZKTLS.sign(signParams);

    return NextResponse.json({ 
      signResult 
    });
  } catch (error) {
    console.error('Primus sign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}