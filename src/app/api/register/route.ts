import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check if table exists indirectly or just catch the error
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await sql`INSERT INTO users (email, password) VALUES (${email}, ${hashed})`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed', 
      details: error.message 
    }, { status: 500 })
  }
}
