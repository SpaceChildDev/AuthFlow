import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [rows, recentLogs] = await Promise.all([
    sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS requests
      FROM otp_logs
      WHERE user_id = ${session.user.id}
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
      ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC') ASC
    `,
    sql`
      SELECT
        l.created_at,
        l.source,
        l.requested_by,
        s.name AS service_name,
        s.slug
      FROM otp_logs l
      JOIN otp_services s ON s.id = l.service_id
      WHERE l.user_id = ${session.user.id}
      ORDER BY l.created_at DESC
      LIMIT 50
    `,
  ])

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
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
              <p className="text-muted-foreground">Monitor usage patterns and request statistics.</p>
            </div>

            <ChartAreaInteractive data={chartData} />

            {/* Request Log */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Requests</h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Requested by</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(recentLogs as any[]).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No requests yet.
                        </td>
                      </tr>
                    ) : (
                      (recentLogs as any[]).map((log: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('tr-TR', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {log.service_name}
                            <span className="ml-2 text-xs text-muted-foreground font-normal">{log.slug}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={log.source === 'slack' ? 'default' : 'secondary'}>
                              {log.source === 'slack' ? '⚡ Slack' : '🔑 API'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {log.requested_by || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
