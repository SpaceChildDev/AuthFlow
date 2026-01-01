import { Shield } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-bold text-xl tracking-tight">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          AuthFlow
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}
