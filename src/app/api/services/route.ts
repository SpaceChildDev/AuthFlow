import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, slug, secret, digits, step, encoding, algorithm, access_token } = await request.json()

  await sql`
    INSERT INTO otp_services (user_id, name, slug, secret, digits, step, encoding, algorithm, access_token)
    VALUES (${session.user.id}, ${name}, ${slug}, ${secret}, ${digits}, ${step}, ${encoding}, ${algorithm}, ${access_token})
  `

  return NextResponse.json({ success: true })
}
