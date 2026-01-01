"use client"

import * as React from "react"
import {
  IconDotsVertical,
  IconKey,
  IconExternalLink,
  IconRefresh,
  IconCopy,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Lock, Globe, Clock, Fingerprint } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { EditServiceDialog } from "./edit-service-dialog"

export function DataTable({ data, apiKey }: { data: any[], apiKey: string | undefined }) {
  const [selectedService, setSelectedService] = React.useState<any>(null)
  const [editingService, setEditingService] = React.useState<any>(null)
  const [liveCode, setLiveCode] = React.useState<any>(null)
  const [isFetching, setIsFetching] = React.useState(false)
  const [origin, setOrigin] = React.useState("")

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const getWebhookUrl = (item: any) => {
    if (!origin) return "Loading..."
    const identifier = item.access_token || item.slug
    return `${origin}/${identifier}?key=${apiKey || ''}&raw=true`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Kopyalandı!")
  }

  const fetchLiveCode = async (service: any) => {
    setSelectedService(service)
    setIsFetching(true)
    setLiveCode(null)
    
    try {
      const identifier = service.access_token || service.slug
      const url = `/${identifier}?key=${apiKey}`
      const res = await fetch(url)
      const result = await res.json()
      
      if (!res.ok) throw new Error(result.error || result.details || "Request failed")
      setLiveCode(result)
    } catch (err: any) {
      console.error("Live code error:", err)
      toast.error("Kod alınamadı: " + err.message)
      setSelectedService(null)
    } finally {
      setIsFetching(false)
    }
  }

  const rotateUrl = async (service: any) => {
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('otp_services')
        .update({ access_token: newToken })
        .eq('id', service.id)

      if (error) throw error
      toast.success("URL rotated successfully!")
      window.location.reload()
    } catch (e: any) {
      toast.error("Rotation failed: " + (e.message || "Permissions error"))
    }
  }

  const resetUrl = async (service: any) => {
    if (!confirm("Are you sure? This will make the URL public again using the slug.")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('otp_services')
        .update({ access_token: null })
        .eq('id', service.id)

      if (error) throw error
      toast.success("URL reset to standard slug")
      window.location.reload()
    } catch (e: any) {
      toast.error("Reset failed: " + (e.message || "Permissions error"))
    }
  }

  const deleteService = async (id: string, name: string) => {
    if (!confirm(`${name} servisini silmek istediğine emin misin?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('otp_services')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success(`${name} başarıyla silindi.`)
      window.location.reload()
    } catch (err: any) {
      toast.error("Silme işlemi başarısız: " + err.message)
    }
  }

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="w-[180px] font-bold">Service</TableHead>
              <TableHead className="min-w-[450px] font-bold">Webhook URL</TableHead>
              <TableHead className="w-[100px] font-bold">Algorithm</TableHead>
              <TableHead className="w-[80px] font-bold text-center">Step</TableHead>
              <TableHead className="w-[80px] font-bold text-center">Digits</TableHead>
              <TableHead className="w-[80px] font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors border-b last:border-0">
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
                        <IconKey size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          {item.name}
                          {item.access_token && <Lock className="h-2.5 w-2.5 text-orange-500" title="Private URL Active" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal lowercase italic">{item.encoding}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 group w-full">
                      <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex-1 whitespace-nowrap">
                        {getWebhookUrl(item)}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => copyToClipboard(getWebhookUrl(item))}
                        disabled={!origin}
                      >
                        <IconCopy size={12} className="text-blue-600" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                      <Fingerprint size={12} className="text-slate-400" />
                      {item.algorithm || 'SHA-1'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-xs font-mono text-slate-500">{item.step}s</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-slate-600">{item.digits}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDotsVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => fetchLiveCode(item)}>
                          <IconRefresh className="mr-2 h-4 w-4" />
                          View Live Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(getWebhookUrl(item))}>
                          <IconCopy className="mr-2 h-4 w-4" />
                          Copy Webhook
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingService(item)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit Configuration
                        </DropdownMenuItem>
                        {item.access_token ? (
                          <>
                            <DropdownMenuItem onClick={() => rotateUrl(item)}>
                              <IconRefresh className="mr-2 h-4 w-4 text-orange-500" />
                              Rotate Private URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => resetUrl(item)}>
                              <Globe className="mr-2 h-4 w-4 text-blue-500" />
                              Reset to Public URL
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => rotateUrl(item)}>
                            <Lock className="mr-2 h-4 w-4 text-orange-500" />
                            Enable Private URL
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:bg-red-50 focus:text-red-600"
                          onClick={() => deleteService(item.id, item.name)}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete Service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <IconKey size={32} stroke={1} />
                    <p>Henüz servis eklenmemiş.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Live Code Dialog */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="sm:max-w-[350px] text-center border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedService?.name} Security Code</DialogTitle>
            <DialogDescription>
              Bu kod her {selectedService?.step || 30} saniyede bir değişir.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            {isFetching ? (
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            ) : liveCode ? (
              <>
                <div className="text-6xl font-black tracking-widest text-blue-600 font-mono drop-shadow-sm">
                  {liveCode.token}
                </div>
                <div className="w-full space-y-3">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <span>Expiring in</span>
                    <span>{liveCode.seconds_remaining}s</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(37,99,235,0.5)]" 
                      style={{ width: `${(liveCode.seconds_remaining / (selectedService?.step || 30)) * 100}%` }}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-semibold" 
                  onClick={() => {
                    navigator.clipboard.writeText(liveCode.token)
                    toast.success("Kod panoya kopyalandı!")
                  }}
                >
                  Copy to Clipboard
                </Button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditServiceDialog 
        service={editingService} 
        open={!!editingService} 
        onOpenChange={(open) => !open && setEditingService(null)} 
      />
    </div>
  )
}