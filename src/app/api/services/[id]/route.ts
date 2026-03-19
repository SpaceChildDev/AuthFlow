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

  await sql`
    UPDATE otp_services SET
      name = ${name}, slug = ${slug}, secret = ${secret},
      digits = ${digits}, step = ${step}, encoding = ${encoding},
      algorithm = ${algorithm}, access_token = ${access_token}
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
