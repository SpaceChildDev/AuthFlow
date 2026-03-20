import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { generateTOTP } from '@/lib/totp'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function verifySlackSignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) return false

  const timestamp = req.headers.get('x-slack-request-timestamp')
  const slackSig = req.headers.get('x-slack-signature')
  if (!timestamp || !slackSig) return false

  // Reject requests older than 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false

  const baseString = `v0:${timestamp}:${rawBody}`
  const hmac = createHmac('sha256', signingSecret).update(baseString).digest('hex')
  const computed = `v0=${hmac}`

  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(slackSig))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const valid = await verifySlackSignature(req, rawBody)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const params = new URLSearchParams(rawBody)
  const text = (params.get('text') || '').trim().toLowerCase()
  const slackUser = params.get('user_name') || params.get('user_id') || 'unknown'

  if (!text) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Usage: `/otp <service-slug>`\nExample: `/otp ads`',
    })
  }

  const results = await sql`
    SELECT * FROM otp_services
    WHERE slug = ${text} OR access_token = ${text}
    LIMIT 1
  `
  const service = (results as any)[0] || null

  if (!service) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Service \`${text}\` not found.`,
    })
  }

  try {
    const result = await generateTOTP(
      service.secret,
      service.digits || 6,
      service.step || 30,
      service.algorithm || 'SHA-1',
      service.encoding || 'base32'
    )

    // Non-blocking log
    sql`
      INSERT INTO otp_logs (service_id, user_id, status_code, source, requested_by)
      VALUES (${service.id}, ${service.user_id}, 200, 'slack', ${slackUser})
    `.catch((e: any) => console.error('Slack OTP log failed:', e))

    return NextResponse.json({
      response_type: 'in_channel',
      text: `*${service.name}* OTP: \`${result.token}\`  _(expires in ${result.seconds_remaining}s)_`,
    })
  } catch (error: any) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Failed to generate OTP for \`${text}\`: ${error.message}`,
    })
  }
}
