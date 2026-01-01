import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowRight, Key, BarChart3 } from "lucide-react";
import Link from "next/link";

export const runtime = 'edge'

export default async function Page() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { count: servicesCount } = await supabase.from('otp_services').select('*', { count: 'exact', head: true });
  const { count: logsCount } = await supabase.from('otp_logs').select('*', { count: 'exact', head: true });

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
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
                <p className="text-muted-foreground">Welcome back, {user.email}.</p>
              </div>
            </div>

            <SectionCards 
              servicesCount={servicesCount || 0} 
              totalRequests={logsCount || 0}
              userEmail={user.email} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Recent Services
                </h3>
                <p className="text-slate-500 text-sm mb-6">Manage your security providers and webhook URLs.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/services">
                    Manage Services <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Usage Analytics
                </h3>
                <p className="text-slate-500 text-sm mb-6">Track and analyze your TOTP generation requests.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/analytics">
                    View Full Reports <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}