import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch Logs for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: logs } = await supabase
    .from('otp_logs')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString());

  // Prepare chart data (Group logs by day)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = logs?.filter(log => log.created_at.startsWith(dateStr)).length || 0;
    chartData.push({
      date: dateStr,
      requests: count
    });
  }

  return (
    <SidebarProvider
      suppressHydrationWarning
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={user} variant="inset" />
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
