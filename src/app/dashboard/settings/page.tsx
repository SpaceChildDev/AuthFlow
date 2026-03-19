"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Shield, Sun } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)

  if (!session?.user) return null

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPasswordLoading(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all services.")) return
    setIsDeleteLoading(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      await signOut({ callbackUrl: '/login' })
    } catch (err: any) {
      toast.error(err.message)
      setIsDeleteLoading(false)
    }
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl">

            <div>
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">Manage your account and security configurations.</p>
            </div>

            {/* Profile Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <CardDescription>Your account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={session.user.email || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Update your account password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={isPasswordLoading}>
                    {isPasswordLoading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* API Security Section */}
            <Card className="shadow-sm border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle>API Security</CardTitle>
                </div>
                <CardDescription>Your Master API Key for automation tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="apikey">Master API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apikey"
                      value="••••••••••••••••••••••••••••••"
                      readOnly
                      className="font-mono bg-white dark:bg-slate-950"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Use your environment API_KEY to authenticate requests. Manage it in your Vercel dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* App Preferences */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  <CardTitle>Preferences</CardTitle>
                </div>
                <CardDescription>Customize your experience.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 border rounded-lg border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Theme Mode</Label>
                    <p className="text-xs text-muted-foreground">Switch between Light and Dark mode.</p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="shadow-sm border-red-100 dark:border-red-900/30 bg-red-50/10">
              <CardHeader>
                <CardTitle className="text-red-600 text-lg">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={isDeleteLoading}
                >
                  {isDeleteLoading ? "Deleting..." : "Delete Account"}
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
