import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json();

    console.log('Auth verify request:', { address, messageLength: message?.length, signatureLength: signature?.length });

    if (!address || !message || !signature) {
      console.error('Missing required fields:', { address: !!address, message: !!message, signature: !!signature });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the signature
    console.log('Verifying signature...');
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    console.log('Signature verification result:', isValid);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Create JWT token
    const token = jwt.sign(
      { address, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Here you would typically save the user to your database
    // For now, we'll just return the token
    
    return NextResponse.json({ 
      success: true, 
      token,
      address 
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}