import { NextRequest, NextResponse } from 'next/server';
import { generateTOTP } from '@/lib/totp';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;
  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('key') || request.headers.get('X-API-Key');
  const digits = parseInt(searchParams.get('digits') || '6');
  const step = parseInt(searchParams.get('step') || '30');
  const raw = searchParams.get('raw') === 'true';

  // Security check
  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Lookup secret (Mocking DB lookup with ENV for now)
  // In a real app, this would be: const secret = await db.tokens.findUnique({ where: { name: service } })
  const envKey = service.toUpperCase().replace(/-/g, '_');
  let secret = process.env[envKey];

  // Also support direct secret if service looks like a secret
  if (!secret && service.length >= 16) {
    secret = service;
  }

  if (!secret) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  try {
    const result = generateTOTP(secret, digits, step);
    
    if (raw) {
      return new Response(result.token, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
