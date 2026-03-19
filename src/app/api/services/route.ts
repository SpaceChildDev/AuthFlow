import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, slug, secret, digits, step, encoding, algorithm, access_token } = await request.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!slug?.trim()) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  if (!secret?.trim()) return NextResponse.json({ error: 'Secret is required' }, { status: 400 })

  const parsedDigits = parseInt(digits)
  const parsedStep = parseInt(step)

  if (isNaN(parsedDigits) || parsedDigits < 6 || parsedDigits > 8) {
    return NextResponse.json({ error: 'Digits must be between 6 and 8' }, { status: 400 })
  }
  if (isNaN(parsedStep) || parsedStep < 15 || parsedStep > 300) {
    return NextResponse.json({ error: 'Step must be between 15 and 300 seconds' }, { status: 400 })
  }

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

  const existing = await sql`
    SELECT id FROM otp_services WHERE user_id = ${session.user.id} AND slug = ${cleanSlug} LIMIT 1
  `
  if (existing.length > 0) {
    return NextResponse.json({ error: `Slug "${cleanSlug}" is already in use` }, { status: 409 })
  }

  await sql`
    INSERT INTO otp_services (user_id, name, slug, secret, digits, step, encoding, algorithm, access_token)
    VALUES (${session.user.id}, ${name.trim()}, ${cleanSlug}, ${secret.trim()}, ${parsedDigits}, ${parsedStep}, ${encoding || 'base32'}, ${algorithm || 'SHA-1'}, ${access_token ?? null})
  `

  return NextResponse.json({ success: true })
}
