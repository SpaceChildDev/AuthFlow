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

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const logs = await sql`
    SELECT created_at FROM otp_logs
    WHERE user_id = ${session.user.id}
    AND created_at >= ${sevenDaysAgo.toISOString()}
  `

  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const count = (logs as any).filter((log: any) => {
       const logDate = log.created_at instanceof Date ? log.created_at.toISOString() : String(log.created_at);
       return logDate.startsWith(dateStr)
    }).length
    chartData.push({ date: dateStr, requests: count })
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
