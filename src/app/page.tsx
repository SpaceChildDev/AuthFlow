import { Shield, ArrowRight, Server, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BuyMeACoffee } from "@/components/bmc-button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            AuthFlow
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-blue-600/10 text-blue-600 p-3 rounded-2xl mb-6">
          <Shield className="h-12 w-12" />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          AuthFlow V2
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
          The ultimate TOTP management platform for automation enthusiasts. 
          Securely store, manage, and generate 2FA tokens at the edge.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
            <div className="bg-green-500/10 text-green-600 w-10 h-10 flex items-center justify-center rounded-lg mb-4">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Secure Storage</h3>
            <p className="text-slate-500 text-sm">Encrypted secrets managed via Supabase and Cloudflare KV for maximum security.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
            <div className="bg-blue-500/10 text-blue-600 w-10 h-10 flex items-center justify-center rounded-lg mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">n8n Friendly</h3>
            <p className="text-slate-500 text-sm">Clean REST API designed specifically for easy integration with n8n and other tools.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
            <div className="bg-purple-500/10 text-purple-600 w-10 h-10 flex items-center justify-center rounded-lg mb-4">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Edge Performance</h3>
            <p className="text-slate-500 text-sm">Powered by Next.js and Cloudflare for sub-millisecond response times globally.</p>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center gap-6">
        <BuyMeACoffee />
        <p className="text-slate-500 text-sm">Created by spacechild-dev</p>
      </footer>
    </div>
  );
}