"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/checkbox"
import { Plus, Loader2, Sparkles, ChevronDown, ChevronUp, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { parseOtpAuthUri } from "@/lib/totp"

export function AddServiceDialog() {
  const [open, setOpen] = useState(false)
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
    algorithm: "SHA-1"
  })
  
  const router = useRouter()
  const supabase = createClient()

  // Generate a random string for private URLs
  const generateRandomToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleMagicInput = (val: string) => {
    const parsed = parseOtpAuthUri(val)
    if (parsed) {
      const suggestedSlug = (parsed.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      setFormData({
        ...formData,
        name: parsed.name || formData.name,
        slug: suggestedSlug || formData.slug,
        secret: parsed.secret || val,
        digits: parsed.digits.toString(),
        step: parsed.step.toString(),
        algorithm: parsed.algorithm
      })
      toast.success("Link format recognized!")
      return
    }
    setFormData({ ...formData, secret: val.trim() })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please login first")

      const accessToken = usePrivateUrl ? generateRandomToken() : null

      const { error } = await supabase.from("otp_services").insert([
        {
          user_id: user.id,
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          secret: formData.secret,
          digits: parseInt(formData.digits),
          step: parseInt(formData.step),
          encoding: formData.encoding,
          algorithm: formData.algorithm,
          access_token: accessToken
        },
      ])

      if (error) throw error

      toast.success(usePrivateUrl ? "Private service created!" : "Service added successfully!")
      setOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", slug: "", secret: "", digits: "6", step: "30", encoding: "base32", algorithm: "SHA-1" })
    setShowAdvanced(false)
    setUsePrivateUrl(false)
  }

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Quick Add Service</DialogTitle>
              <DialogDescription>
                Paste secret or otpauth link.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-6">
              
              <div className="grid gap-2">
                <Label htmlFor="magic-input" className="text-blue-600 font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Fast Setup
                </Label>
                <Input 
                  id="magic-input" 
                  placeholder="Paste secret or otpauth:// link here..." 
                  className="border-blue-200 focus-visible:ring-blue-500"
                  onChange={(e) => handleMagicInput(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input id="name" placeholder="Github" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input id="slug" placeholder="my-github" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border border-blue-100 bg-blue-50/50">
                <input 
                  type="checkbox" 
                  id="private-url" 
                  checked={usePrivateUrl} 
                  onChange={(e) => setUsePrivateUrl(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="private-url" className="text-sm font-bold leading-none cursor-pointer flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Use Private Random URL
                  </label>
                  <p className="text-[10px] text-muted-foreground italic">
                    Generates a secret random URL extension for extra security.
                  </p>
                </div>
              </div>

              <Button type="button" variant="ghost" size="sm" className="w-fit text-slate-500 font-normal px-0 hover:bg-transparent" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                {showAdvanced ? "Hide Advanced" : "Advanced Settings"}
              </Button>

              {showAdvanced && (
                <div className="grid gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="grid gap-2">
                    <Label htmlFor="secret">Manual Secret Key</Label>
                    <Input id="secret" value={formData.secret} onChange={(e) => setFormData({ ...formData, secret: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Algorithm</Label>
                      <Select value={formData.algorithm} onValueChange={(v) => setFormData({ ...formData, algorithm: v })}>
                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="SHA-1">SHA-1</SelectItem><SelectItem value="SHA-256">SHA-256</SelectItem><SelectItem value="SHA-512">SHA-512</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="digits">Digits</Label>
                      <Input id="digits" type="number" value={formData.digits} onChange={(e) => setFormData({ ...formData, digits: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-bold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Setup"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
