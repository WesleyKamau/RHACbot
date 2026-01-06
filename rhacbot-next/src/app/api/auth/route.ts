import { NextResponse } from 'next/server';
import { Config } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { password } = data;

    if (!password) {
      return NextResponse.json(
        { error: 'Missing password' },
        { status: 400 }
      );
    }

    const adminPassword = Config.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not configured');
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      return NextResponse.json({ message: 'Authenticated' });
    } else {
      console.warn('Failed authentication attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
