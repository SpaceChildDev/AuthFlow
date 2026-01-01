import { Shield, Activity, BarChart3, Lock } from "lucide-react"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards({ 
  servicesCount, 
  totalRequests,
  userEmail 
}: { 
  servicesCount: number, 
  totalRequests: number,
  userEmail: string | undefined 
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Total Services</CardTitle>
          <Shield className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardHeader className="pt-0">
          <div className="text-2xl font-bold">{servicesCount}</div>
          <CardDescription>Configured providers</CardDescription>
        </CardHeader>
      </Card>
      
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">OTP Requests (7d)</CardTitle>
          <BarChart3 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardHeader className="pt-0">
          <div className="text-2xl font-bold">{totalRequests}</div>
          <CardDescription>Total API calls</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Security Status</CardTitle>
          <Lock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardHeader className="pt-0">
          <div className="text-2xl font-bold">Encrypted</div>
          <CardDescription>Secrets protected</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Network Status</CardTitle>
          <Activity className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardHeader className="pt-0">
          <div className="text-2xl font-bold">Optimal</div>
          <CardDescription>Global edge Active</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}