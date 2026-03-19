import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AddServiceDialog } from '@/components/add-service-dialog'

export default async function Page() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const services = await sql`
    SELECT * FROM otp_services
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `

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
                <h2 className="text-2xl font-bold tracking-tight">Services</h2>
                <p className="text-muted-foreground">Add and manage your TOTP service providers.</p>
              </div>
              <AddServiceDialog />
            </div>
            <div className="w-full">
              <DataTable data={services as any[]} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
