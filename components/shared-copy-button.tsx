'use client'

import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CopyFolderDialog } from '@/components/copy-folder-dialog'
import { createClient } from '@/lib/supabase/client'

interface SharedCopyButtonProps {
  shareSlug: string
  itemName: string
  itemType: 'file' | 'folder'
  label?: 'full' | 'short'
  className?: string
}

export function SharedCopyButton({
  shareSlug,
  itemName,
  itemType,
  label = 'full',
  className,
}: SharedCopyButtonProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (isMounted) {
          setIsAuthenticated(Boolean(session?.user))
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false)
        }
      }
    }

    void checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const handleClick = () => {
    if (isAuthenticated === null) {
      return
    }

    if (!isAuthenticated) {
      toast.error(`Sign in to copy this ${itemType} to your workspace`)
      return
    }

    setCopyDialogOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isAuthenticated === null}
        className={className}
        title={`Copy ${itemType} to workspace`}
      >
        <Copy className="h-4 w-4" />
        <span>{label === 'full' ? 'Copy to Workspace' : 'Copy'}</span>
      </Button>
      {isAuthenticated ? (
        <CopyFolderDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          shareSlug={shareSlug}
          itemName={itemName}
          itemType={itemType}
        />
      ) : null}
    </>
  )
}
