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
import { toast } from 'sonner'

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
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success('Share link copied')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Could not copy share link')
      }
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCopied(false)
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="pr-8 text-left break-words">
            Share &quot;{fileName}&quot;
          </DialogTitle>
          <DialogDescription className="text-left">
            Make this file public to share it with others.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1 pr-2">
              <Label htmlFor="public" className="text-sm font-medium">
                Public access
              </Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this file
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={onTogglePublic}
              className="self-start sm:self-center"
            />
          </div>

          {isPublic && slug && (
            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Share link</Label>
                <p className="text-sm text-muted-foreground">
                  Copy or open the public URL for this file.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Input
                  value={shareUrl}
                  readOnly
                  className="min-w-0 font-mono text-sm"
                />

                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy link'}
                    className="w-full sm:w-9"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="sm:hidden">{copied ? 'Copied' : 'Copy'}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    aria-label="Open in new tab"
                    className="w-full sm:w-9"
                  >
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sm:hidden">Open</span>
                      <span className="sr-only">Open in new tab</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
