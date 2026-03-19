import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const rows = await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS requests
    FROM otp_logs
    WHERE user_id = ${session.user.id}
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
    ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC') ASC
  `

  // Fill in missing days with 0
  const countMap = new Map(rows.map((r: any) => [r.date, r.requests]))
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    chartData.push({ date: dateStr, requests: countMap.get(dateStr) ?? 0 })
  }

  return (
    <SidebarProvider
      suppressHydrationWarning
      style={{
        "--sidebar-width": "calc(var(--spacing) * 60)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar user={session.user} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
                <p className="text-muted-foreground">Monitor usage patterns and request statistics.</p>
              </div>
            </div>
            <ChartAreaInteractive data={chartData} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
