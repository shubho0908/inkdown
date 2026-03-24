'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Check, Copy, ExternalLink } from 'lucide-react'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  isPublic: boolean
  slug: string | null
  onTogglePublic: (isPublic: boolean) => void
}

export function ShareDialog({
  open,
  onOpenChange,
  fileName,
  isPublic,
  slug,
  onTogglePublic,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/view/${slug}`
    : ''

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="break-words pr-8">Share &quot;{fileName}&quot;</DialogTitle>
          <DialogDescription>
            Make this file public to share it with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5 pr-2">
              <Label htmlFor="public">Public access</Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this file
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={onTogglePublic}
            />
          </div>

          {isPublic && slug && (
            <div className="grid gap-2">
              <Label>Share link</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={shareUrl}
                  readOnly
                  className="min-w-0 font-mono text-sm"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy link</span>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  asChild
                  className="shrink-0"
                >
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Open in new tab</span>
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
