'use client'

import {
  Bold,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface MarkdownEditorToolbarProps {
  onWrap: (before: string, after?: string) => void
  onLinePrefix: (prefix: string) => void
}

type ToolbarButton =
  | { type: 'divider' }
  | {
      type: 'button'
      icon: LucideIcon
      action: 'wrap' | 'line'
      args: [string, string?]
      title: string
    }

const toolbarButtons: ToolbarButton[] = [
  { type: 'button', icon: Bold, action: 'wrap', args: ['**', '**'], title: 'Bold' },
  { type: 'button', icon: Italic, action: 'wrap', args: ['*', '*'], title: 'Italic' },
  {
    type: 'button',
    icon: Strikethrough,
    action: 'wrap',
    args: ['~~', '~~'],
    title: 'Strikethrough',
  },
  { type: 'divider' },
  { type: 'button', icon: Heading1, action: 'line', args: ['# '], title: 'Heading 1' },
  { type: 'button', icon: Heading2, action: 'line', args: ['## '], title: 'Heading 2' },
  { type: 'button', icon: Heading3, action: 'line', args: ['### '], title: 'Heading 3' },
  { type: 'divider' },
  { type: 'button', icon: List, action: 'line', args: ['- '], title: 'Bullet List' },
  {
    type: 'button',
    icon: ListOrdered,
    action: 'line',
    args: ['1. '],
    title: 'Numbered List',
  },
  {
    type: 'button',
    icon: CheckSquare,
    action: 'line',
    args: ['- [ ] '],
    title: 'Task List',
  },
  { type: 'divider' },
  { type: 'button', icon: Quote, action: 'line', args: ['> '], title: 'Quote' },
  { type: 'button', icon: Code, action: 'wrap', args: ['`', '`'], title: 'Inline Code' },
  {
    type: 'button',
    icon: Minus,
    action: 'wrap',
    args: ['\n---\n'],
    title: 'Horizontal Rule',
  },
  { type: 'divider' },
  { type: 'button', icon: Link2, action: 'wrap', args: ['[', '](url)'], title: 'Link' },
  { type: 'button', icon: Image, action: 'wrap', args: ['![alt](', ')'], title: 'Image' },
]

export function MarkdownEditorToolbar({
  onWrap,
  onLinePrefix,
}: MarkdownEditorToolbarProps) {
  return (
    <div className="min-w-0 overflow-hidden border-b bg-muted/30">
      <div className="overflow-x-visible sm:overflow-x-auto">
        <div className="flex min-w-full flex-wrap items-center gap-1 px-2 py-1.5 sm:w-max sm:min-w-full sm:flex-nowrap">
          {toolbarButtons.map((button, index) =>
            button.type === 'divider' ? (
              <div key={index} className="mx-1 hidden h-6 w-px bg-border sm:block" />
            ) : (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  if (button.action === 'wrap') {
                    onWrap(button.args[0], button.args[1])
                    return
                  }

                  onLinePrefix(button.args[0])
                }}
                title={button.title}
              >
                <button.icon className="h-4 w-4" />
                <span className="sr-only">{button.title}</span>
              </Button>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
