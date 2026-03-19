import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// ONE-TIME SETUP ROUTE — DELETE AFTER USE
// Requires: ?secret=SETUP_SECRET header to prevent unauthorized access

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS otp_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        secret TEXT NOT NULL,
        digits INTEGER DEFAULT 6,
        step INTEGER DEFAULT 30,
        algorithm TEXT DEFAULT 'SHA-1',
        encoding TEXT DEFAULT 'base32',
        access_token TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS otp_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES otp_services(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status_code INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: 'Tables created. DELETE this route file now: src/app/api/setup/route.ts'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
