"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Sun, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [showKey, setShowKey] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    }
    getUser();
  }, []);

  if (!user) return null;

  return (
    <SidebarProvider
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
                  <Input id="email" value={user.email} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Password reset email sent (Coming soon)")}>
                  Update Password
                </Button>
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
                      value={showKey ? "7KmN9pQrS2tUvW8xYz3aB5cDe6fGhJ4L" : "••••••••••••••••••••••••••••••"} 
                      readOnly 
                      className="font-mono bg-white dark:bg-slate-950" 
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    This key grants full access to generate OTPs. Never share this in public code.
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
                  <Button variant="outline" size="sm">Toggle Theme</Button>
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
                <Button variant="destructive" size="sm">Delete Account</Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}