"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  type: "file" | "folder";
  onRename: (newName: string) => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  type,
  onRename,
}: RenameDialogProps) {
  const [localName, setLocalName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localName.trim();
    if (trimmed && trimmed !== currentName) {
      onRename(trimmed);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={currentName} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename {type}</DialogTitle>
          <DialogDescription>Enter a new name for this {type}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit(e);
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!localName.trim() || localName.trim() === currentName}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
