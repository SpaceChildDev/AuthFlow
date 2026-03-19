import { NextRequest, NextResponse } from 'next/server';
import { generateTOTP } from '@/lib/totp';
import { sql } from '@/lib/db'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;
  
  // 1. Skip reserved paths
  const reserved = ['login', 'dashboard', 'auth', 'favicon.ico', 'api', '_next', 'static'];
  if (reserved.includes(service.toLowerCase())) {
    return new Response(null, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('key') || request.headers.get('X-API-Key');
  const raw = searchParams.get('raw') === 'true';

  // 2. Security check
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return NextResponse.json({ 
      error: 'Unauthorized', 
      details: 'Invalid API Key. Please check your ?key= parameter.' 
    }, { status: 401 });
  }

  // 3. Lookup service
  const results = await sql`
    SELECT * FROM otp_services
    WHERE slug = ${service} OR access_token = ${service}
    LIMIT 1
  `
  const serviceData = (results as any)[0] || null

  let secret = serviceData?.secret;
  let digits = serviceData?.digits || parseInt(searchParams.get('digits') || '6');
  let step = serviceData?.step || parseInt(searchParams.get('step') || '30');
  let algorithm = serviceData?.algorithm || (searchParams.get('algo') || 'SHA-1');
  let encoding = serviceData?.encoding || 'base32';

  // 4. Fallback to direct secret (if 16+ chars and not found in DB)
  if (!secret && service.length >= 16) {
    secret = service;
  }

  if (!secret) {
    return NextResponse.json({ 
      error: 'No secret found',
      details: `Service "${service}" not found in database.`,
      debug: { service }
    }, { status: 404 });
  }

  try {
    const result = await generateTOTP(secret, digits, step, algorithm, encoding);
    
    // Non-blocking log
    if (serviceData?.id) {
      sql`
        INSERT INTO otp_logs (service_id, user_id, status_code)
        VALUES (${serviceData.id}, ${serviceData.user_id}, 200)
      `.catch(e => console.error("Logging failed:", e))
    }

    if (raw) {
      return new Response(result.token, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: 'OTP Generation Failed', details: error.message }, { status: 500 });
  }
}
