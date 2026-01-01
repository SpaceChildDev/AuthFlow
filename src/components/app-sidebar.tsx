"use client"

import * as React from "react"
import {
  IconDashboard,
  IconSettings,
  IconKey,
  IconLifebuoy,
} from "@tabler/icons-react"
import { Shield, BarChart3 } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { BuyMeACoffee } from "@/components/bmc-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Services",
    url: "/dashboard/services",
    icon: IconKey,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
  },
]

const navSecondary = [
  {
    title: "Support",
    url: "https://github.com/spacechild-dev/AuthFlow",
    icon: IconLifebuoy,
  },
]

export function AppSidebar({ user, ...props }: { user: any } & React.ComponentProps<typeof Sidebar>) {
  const userData = {
    name: user?.email?.split('@')[0] || "User",
    email: user?.email || "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 text-blue-600 hover:bg-blue-50"
            >
              <a href="/dashboard">
                <Shield className="!size-5" />
                <span className="text-base font-bold">AuthFlow</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="gap-4">
        <BuyMeACoffee />
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
