"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Sparkles, ChevronDown, ChevronUp, Lock, RefreshCw, Globe } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { parseOtpAuthUri } from "@/lib/totp"

export function EditServiceDialog({ 
  service, 
  open, 
  onOpenChange 
}: { 
  service: any, 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [usePrivateUrl, setUsePrivateUrl] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    secret: "",
    digits: "6",
    step: "30",
    encoding: "base32",
    algorithm: "SHA-1",
    access_token: ""
  })
  
  const router = useRouter()
  const supabase = createClient()

  const generateRandomToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        slug: service.slug,
        secret: service.secret,
        digits: service.digits.toString(),
        step: service.step.toString(),
        encoding: service.encoding || "base32",
        algorithm: service.algorithm || "SHA-1",
        access_token: service.access_token || ""
      })
      setUsePrivateUrl(!!service.access_token)
    }
  }, [service])

  const handleMagicInput = (val: string) => {
    const parsed = parseOtpAuthUri(val)
    if (parsed) {
      setFormData({
        ...formData,
        name: parsed.name || formData.name,
        secret: parsed.secret || val,
        digits: parsed.digits.toString(),
        step: parsed.step.toString(),
        algorithm: parsed.algorithm
      })
      toast.success("Settings updated from link!")
      return
    }
    setFormData({ ...formData, secret: val.trim() })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const finalToken = usePrivateUrl 
        ? (formData.access_token || generateRandomToken()) 
        : null

      const { error } = await supabase
        .from("otp_services")
        .update({
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
          secret: formData.secret,
          digits: parseInt(formData.digits),
          step: parseInt(formData.step),
          encoding: formData.encoding,
          algorithm: formData.algorithm,
          access_token: finalToken
        })
        .eq("id", service.id)

      if (error) throw error

      toast.success("Service updated successfully!")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update or overwrite settings for {service?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            
            <div className="grid gap-2">
              <Label htmlFor="edit-magic" className="text-blue-600 font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Quick Overwrite
              </Label>
              <Input 
                id="edit-magic" 
                placeholder="Paste new secret or link here..." 
                className="border-blue-200 focus-visible:ring-blue-500 text-xs"
                onChange={(e) => handleMagicInput(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input id="edit-slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
              </div>
            </div>

            {/* Private URL Management */}
            <div className="space-y-3 p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer" htmlFor="toggle-private">
                  <Lock className="h-3.5 w-3.5 text-orange-500" /> Private URL Mode
                </Label>
                <input 
                  type="checkbox" 
                  id="toggle-private"
                  checked={usePrivateUrl} 
                  onChange={(e) => setUsePrivateUrl(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
              </div>
              
              {usePrivateUrl && (
                <div className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                  <Input 
                    value={formData.access_token || "Will be generated..."} 
                    readOnly 
                    className="h-8 text-[10px] font-mono bg-white dark:bg-slate-950" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 shrink-0"
                    onClick={() => setFormData({ ...formData, access_token: generateRandomToken() })}
                    title="Rotate Token"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {!usePrivateUrl && service?.access_token && (
                <p className="text-[10px] text-orange-600 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> URL will revert to standard slug.
                </p>
              )}
            </div>

            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="w-fit text-slate-500 font-normal px-0 hover:bg-transparent"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
              {showAdvanced ? "Hide Manual Config" : "Manual Configuration"}
            </Button>

            {showAdvanced && (
              <div className="grid gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="grid gap-2">
                  <Label htmlFor="edit-secret">Secret Key</Label>
                  <Input id="edit-secret" value={formData.secret} onChange={(e) => setFormData({ ...formData, secret: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Algorithm</Label>
                    <Select value={formData.algorithm} onValueChange={(v) => setFormData({ ...formData, algorithm: v })}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHA-1">SHA-1</SelectItem>
                        <SelectItem value="SHA-256">SHA-256</SelectItem>
                        <SelectItem value="SHA-512">SHA-512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-digits">Digits</Label>
                    <Input id="edit-digits" type="number" value={formData.digits} onChange={(e) => setFormData({ ...formData, digits: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-bold">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
