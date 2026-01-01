import { NextRequest, NextResponse } from 'next/server';
import { generateTOTP } from '@/lib/totp';
import { createClient } from '@supabase/supabase-js';

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 3. Lookup service (Standard PostgREST syntax for .or)
  const { data: serviceData, error: dbError } = await supabase
    .from('otp_services')
    .select('*')
    .or(`slug.eq.${service},access_token.eq.${service}`)
    .maybeSingle();

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
      supabase.from('otp_logs').insert([
        { service_id: serviceData.id, user_id: serviceData.user_id, status_code: 200 }
      ]).then();
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
