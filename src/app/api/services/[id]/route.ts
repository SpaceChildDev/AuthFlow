import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
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
    SELECT id FROM otp_services
    WHERE user_id = ${session.user.id} AND slug = ${cleanSlug} AND id != ${id}
    LIMIT 1
  `
  if (existing.length > 0) {
    return NextResponse.json({ error: `Slug "${cleanSlug}" is already in use` }, { status: 409 })
  }

  await sql`
    UPDATE otp_services SET
      name = ${name.trim()}, slug = ${cleanSlug}, secret = ${secret.trim()},
      digits = ${parsedDigits}, step = ${parsedStep}, encoding = ${encoding || 'base32'},
      algorithm = ${algorithm || 'SHA-1'}, access_token = ${access_token ?? null}
    WHERE id = ${id} AND user_id = ${session.user.id}
  `

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM otp_services WHERE id = ${id} AND user_id = ${session.user.id}`

  return NextResponse.json({ success: true })
}
